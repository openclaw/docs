---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Debugging von Gateway- und Agent-Verhalten
summary: 'Test-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-05-05T06:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Reihe
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dafür, wie wir testen:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen.
- Wie Sie Regressionstests für reale Modell-/Provider-Probleme hinzufügen.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Überblick](/de/concepts/qa-e2e-automation) — Architektur, Befehlsoberfläche, Szenario-Erstellung.
- [Matrix-QA](/de/concepts/qa-matrix) — Referenz für `pnpm openclaw qa matrix`.
- [QA-Kanal](/de/channels/qa-channel) — das synthetische Transport-Plugin, das von repo-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Testsuites und der Docker-/Parallels-Runner. Der QA-spezifische Runner-Abschnitt unten ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die oben genannten Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einem großzügig ausgestatteten Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Datei-Targeting routet jetzt auch Erweiterungs-/Kanalpfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit wünschen:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine Live-Datei gezielt und leise ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laufzeit-Performance-Berichte: dispatchen Sie `OpenClaw Performance` mit
  `live_gpt54=true` für einen echten `openai/gpt-5.4`-Agent-Turn oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Täglich geplante Läufe
  veröffentlichen Mock-Provider-, Deep-Profile- und GPT-5.4-Lane-Artefakte in
  `openclaw/clawgrit-reports`, wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist. Der
  Mock-Provider-Bericht enthält außerdem Quellcode-Level-Zahlen zu Gateway-Boot,
  Speicher, Plugin-Druck, wiederholter Fake-Model-Hello-Schleife und CLI-Start.
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Prüfung im Stil eines Dateilesevorgangs aus.
    Modelle, deren Metadaten `image`-Eingaben ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Tägliche `OpenClaw Scheduled Live And E2E Checks` und manuelle
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, der separate Docker-Live-Modell-
    Matrix-Jobs enthält, nach Provider geshardet.
  - Für fokussierte CI-Neuläufe dispatchen Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue besonders aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Aufrufern hinzu.
- Native Codex-Smoke für gebundenen Chat: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert anschließend, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt ACP geroutet werden.
- Smoke für den Codex-App-Server-Harness: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns über den Plugin-eigenen Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Prüfungen aus. Deaktivieren Sie die Sub-Agent-Prüfung mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet nach der Sub-Agent-Prüfung, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht gesetzt ist.
- Smoke für den Crestodian-Rettungsbefehl: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Absicherungsprüfung für die Oberfläche des Rettungsbefehls im Nachrichtenkanal.
    Sie übt `/crestodian status` aus, reiht eine persistente Modelländerung ein,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Config-Schreibpfad.
- Docker-Smoke für den Crestodian-Planer: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem configlosen Container mit einer Fake-Claude-CLI auf `PATH`
    aus und verifiziert, dass der Fuzzy-Planer-Fallback in einen auditierten, typisierten
    Config-Schreibvorgang übersetzt wird.
- Docker-Smoke für den ersten Crestodian-Lauf: `pnpm test:docker:crestodian-first-run`
  - Startet mit einem leeren OpenClaw-State-Verzeichnis, routet reines `openclaw` an
    Crestodian, wendet Setup-/Modell-/Agent-/Discord-Plugin- und SecretRef-Schreibvorgänge an,
    validiert die Config und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad ist
    auch in QA Lab abgedeckt durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot-/Kimi-Kosten-Smoke: Führen Sie mit gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus und danach einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistenten-Transkript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlgeschlagenen Fall benötigen, bevorzugen Sie das Eingrenzen von Live-Tests über die unten beschriebenen Allowlist-Env-Vars.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Testsuites, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. Agentic Parity ist unter
`QA-Lab - All Lanes` und Release-Validierung verschachtelt, nicht als eigenständiger PR-Workflow.
Breite Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Checks verwenden. Stabile/standardmäßige Release-
Checks halten exhaustive Live-/Docker-Soak-Läufe hinter `run_release_soak=true`; das
`full`-Profil erzwingt Soak. `QA-Lab - All Lanes`
läuft nächtlich auf `main` und per manuellem Dispatch mit der Mock-Parity-Lane, Live-
Matrix-Lane, Convex-verwalteten Live-Telegram-Lane und Convex-verwalteten Live-Discord-
Lane als parallele Jobs. Geplante QA- und Release-Checks übergeben Matrix
`--profile fast` explizit, während die Matrix-CLI und die manuelle Workflow-Eingabe
standardmäßig `all` bleiben; manueller Dispatch kann `all` in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`-Jobs sharden. `OpenClaw Release
Checks` führt vor der Release-Freigabe Parity plus die schnelle Matrix- und Telegram-Lane aus
und verwendet `mock-openai/gpt-5.5` für Release-Transport-Checks, damit sie
deterministisch bleiben und den normalen Provider-Plugin-Start vermeiden. Diese Live-Transport-
Gateways deaktivieren Speichersuche; Speicherverhalten bleibt durch die QA-Parity-
Suites abgedeckt.

Full-Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
`ghcr.io/openclaw/openclaw-live-test:<sha>`-Image, das einmal pro ausgewähltem
Commit gebaut wird, und ziehen es dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, statt es
in jedem Shard neu zu bauen.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität 4
    (begrenzt durch die Anzahl der ausgewählten Szenarien). Verwenden Sie
    `--concurrency <count>`, um die Worker-Anzahl anzupassen, oder
    `--concurrency 1` für die ältere serielle Lane.
  - Beendet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie
    `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code
    wünschen.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für
    experimentelle Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm test:plugins:kitchen-sink-live`
  - Führt den Live-OpenAI-Kitchen-Sink-Plugin-Spießrutenlauf über QA Lab aus. Es
    installiert das externe Kitchen-Sink-Paket, verifiziert das Inventar der Plugin-SDK-Oberfläche,
    prüft `/healthz` und `/readyz`, zeichnet Gateway-CPU/RSS-
    Nachweise auf, führt einen Live-OpenAI-Turn aus und prüft adversarielle Diagnosen.
    Erfordert Live-OpenAI-Authentifizierung wie `OPENAI_API_KEY`. In hydrierten Testbox-
    Sitzungen lädt es automatisch das Testbox-Live-Auth-Profil, wenn der
    `openclaw-testbox-env`-Helper vorhanden ist.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Start-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte CPU-Beobachtungs-
    Zusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Kennzeichnet standardmäßig nur anhaltende Hot-CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startspitzen als Metriken aufgezeichnet
    werden, ohne wie die minutenlange Gateway-Peg-Regression zu wirken.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der Checkout
    noch keine frische Runtime-Ausgabe enthält.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und `CODEX_HOME`,
    wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über
    den gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht plus Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatororientierte QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut einen npm-Tarball aus dem aktuellen Checkout, installiert ihn global in
    Docker, führt nichtinteraktives OpenAI-API-Schlüssel-Onboarding aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass die paketierte Plugin-Runtime ohne Start-
    Abhängigkeitsreparatur geladen wird, führt doctor aus und führt einen lokalen Agent-Turn gegen einen
    gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Packaged-Install-
    Lane mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Built-App-Docker-Smoke für eingebettete Runtime-Kontext-
    Transkripte aus. Es verifiziert, dass verborgener OpenClaw-Runtime-Kontext als
    nicht angezeigte benutzerdefinierte Nachricht persistiert wird, statt in den sichtbaren Benutzer-Turn zu lecken,
    und seedet anschließend eine betroffene defekte Sitzungs-JSONL und verifiziert, dass
    `openclaw doctor --fix` sie mit einem Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Installed-Package-
    Onboarding aus, konfiguriert Telegram über die installierte CLI und verwendet dann die
    Live-Telegram-QA-Lane mit diesem installierten Paket als SUT-Gateway erneut.
  - Standardwert ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen einen aufgelösten lokalen Tarball zu testen,
    statt aus der Registry zu installieren.
  - Verwendet dieselben Telegram-env-Anmeldedaten oder dieselbe Convex-Anmeldedatenquelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper automatisch Convex aus.
  - Der Wrapper validiert die Telegram- oder Convex-Anmeldedaten-env auf dem Host vor
    Docker-Build-/Installationsarbeit. Setzen Sie `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    nur, wenn Sie bewusst das Pre-Credential-Setup debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Sie läuft nicht beim Merge. Der Workflow verwendet die
    `qa-live-shared`-Umgebung und Convex-CI-Anmeldedaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für seitlich ausgeführten Produktnachweis
  gegen ein Kandidatenpaket bereit. Es akzeptiert einen vertrauenswürdigen Ref, veröffentlichte npm-Spezifikation,
  HTTPS-Tarball-URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Run, lädt
  die normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt dann den
  bestehenden Docker-E2E-Scheduler mit Smoke-, Paket-, Produkt-, Full- oder benutzerdefinierten
  Lane-Profilen aus. Setzen Sie `telegram_mode=mock-openai` oder `live-frontier`, um den
  Telegram-QA-Workflow gegen dasselbe `package-under-test`-Artefakt auszuführen.
  - Aktueller Beta-Produktnachweis:

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

- Artefaktnachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Run herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Channels/Plugins über Konfigurations-
    Änderungen.
  - Verifiziert, dass Setup-Discovery unkonfigurierte herunterladbare Plugins auslässt,
    die erste konfigurierte doctor-Reparatur jedes fehlende herunterladbare
    Plugin explizit installiert und ein zweiter Neustart keine verborgene Abhängigkeits-
    Reparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der
    Post-Update-doctor des Kandidaten Altlasten von Plugin-Abhängigkeiten ohne eine
    harness-seitige Postinstall-Reparatur bereinigt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Packaged-Install-Update-Smoke über Parallels-Gäste aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt dann
    den installierten Befehl `openclaw update` im selben Gast aus und verifiziert die
    installierte Version, den Update-Status, die Gateway-Bereitschaft und einen lokalen
    Agent-Turn.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, während
    Sie an einem Gast iterieren. Verwenden Sie `--json` für den Pfad zum Zusammenfassungsartefakt und
    den Status je Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für den Live-Agent-Turn-Nachweis.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes
    OpenAI-Modell validieren.
  - Umschließen Sie lange lokale Runs mit einem Host-Timeout, damit Parallels-Transport-Stockungen nicht
    den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten mit Post-Update-doctor- und Paket-
    Update-Arbeit verbringen; das ist weiterhin gesund, wenn das verschachtelte npm-
    Debug-Log fortschreitet.
  - Führen Sie diesen Aggregat-Wrapper nicht parallel zu einzelnen Parallels-
    macOS-, Windows- oder Linux-Smoke-Lanes aus. Sie teilen sich VM-Zustand und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Gateway-Zustand des Gasts kollidieren.
  - Der Post-Update-Nachweis führt die normale gebündelte Plugin-Oberfläche aus, weil
    Capability-Fassaden wie Sprache, Bilderzeugung und Medien-
    Verständnis über gebündelte Runtime-APIs geladen werden, selbst wenn der Agent-
    Turn selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout — paketierte Installationen liefern `qa-lab` nicht aus.
  - Vollständige CLI, Profil-/Szenariokatalog, env-Variablen und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus und verwendet die Driver- und SUT-Bot-Tokens aus env.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwenden Sie standardmäßig env-Modus, oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu nutzen.
  - Beendet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie
    `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code
    wünschen.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Aktivieren Sie für stabile Bot-zu-Bot-Beobachtung den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Gruppen-Bot-Traffic beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten RTT von der Sendeanfrage des Drivers bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderlaufen; die Abdeckungsmatrix je Lane befindet sich in [QA-Übersicht → Live-Transport-Abdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und ist nicht Teil dieser Matrix.

### Geteilte Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA Lab einen exklusiven Lease aus einem Convex-gestützten Pool, sendet Heartbeats
für diesen Lease, während die Lane läuft, und gibt den Lease beim Herunterfahren frei.

Referenz-Convex-Projektscaffold:

- `qa/convex-credential-broker/`

Erforderliche env-Variablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (Standard ist `ci` in CI, sonst `maintainer`)

Optionale env-Variablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs für rein lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im Normalbetrieb `https://` verwenden.

Admin-Befehle für Maintainer (Pool hinzufügen/entfernen/auflisten) erfordern speziell
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsbefehle für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets,
den Endpunkt-Präfix, das HTTP-Timeout und die Erreichbarkeit von Admin/List zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-
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

Payload-Form für Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer Telegram-Chat-ID-String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Kanal zu QA hinzufügen

Die Architektur- und Szenario-Hilfsnamen für neue Kanaladapter finden Sie in [QA-Überblick → Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Die Mindestanforderung: Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Nahtstelle, deklarieren Sie `qaRunners` im Plugin-Manifest, mounten Sie ihn als `openclaw qa <runner>`, und erstellen Sie Szenarien unter `qa/scenarios/`.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden die Shard-Gruppe `vitest.full-*.config.ts` und können Multi-Project-Shards für parallele Planung in projektbezogene Konfigurationen erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten Shard `unit-ui`
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites `api.js`- und
    `runtime-api.js`-Fallback-Verhalten mit generierten kleinen Plugin-Fixtures nachweisen, nicht
    mit echten gebündelten Plugin-Source-APIs. Echte Plugin-API-Ladevorgänge gehören in
    Plugin-eigene Vertrags-/Integrationssuiten.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Nicht zielgerichtetes `pnpm test` führt zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Project-Prozesses aus. Das senkt Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Plugin-Arbeit unabhängige Suiten aushungert.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil ein Watch-Loop mit mehreren Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` die vollständige Startlast des Root-Projekts vermeidet.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig in günstige bereichsbezogene Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Quellzuordnungen und lokale Importgraph-Abhängige. Änderungen an Konfiguration/Setup/Packages führen keine breiten Tests aus, es sei denn, Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist der normale intelligente lokale Check-Gate für schmale Arbeit. Es klassifiziert den Diff in Core, Core-Tests, Plugins, Plugin-Tests, Apps, Dokumentation, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise. Versionsanhebungen nur für Release-Metadaten führen zielgerichtete Versions-/Konfigurations-/Root-Dependency-Prüfungen aus, mit einem Guard, der Package-Änderungen außerhalb des Top-Level-Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Live-Docker-Scheduler-Dry-Run. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Dependency-, Export-, Versions- und andere Package-Surface-Änderungen verwenden weiterhin die breiteren Guards.
    - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Hilfen, `plugin-sdk` und ähnlichen reinen Utility-Bereichen werden durch die Lane `unit-fast` geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Hilfsquelldateien ordnen Changed-Mode-Läufe außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Hilfsänderungen nicht die gesamte schwere Suite für dieses Verzeichnis erneut ausführen.
    - `auto-reply` hat dedizierte Buckets für Top-Level-Core-Hilfen, Top-Level-`reply.*`-Integrationstests und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards auf, damit kein importlastiger Bucket den gesamten Node-Auslauf allein trägt.
    - Normale PR-/Main-CI überspringt absichtlich den Plugin-Batch-Sweep und den nur für Releases vorgesehenen Shard `agentic-plugins`. Full Release Validation löst für diese Plugin-lastigen Suiten bei Release-Kandidaten den separaten Child-Workflow `Plugin Prerelease` aus.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Message-Tool-Discovery-Eingaben oder den Runtime-Kontext der Compaction ändern,
      behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Hilfsregressionen für reine Routing- und Normalisierungs-
      Grenzen hinzu.
    - Halten Sie die Integrationssuiten des eingebetteten Runners gesund:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suiten verifizieren, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin
      durch die echten `run.ts`- / `compact.ts`-Pfade laufen; reine Hilfstests sind
      kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool und Isolationsstandards">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den
      nicht isolierten Runner über die Root-Projekte, E2E- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft aber ebenfalls auf dem
      gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben `threads`- + `isolate: false`-
      Standards aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt Vitest-Child-Node-Prozessen standardmäßig
      `--no-maglev` hinzu, um V8-Compile-Churn während großer lokaler Läufe zu reduzieren.
      Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standard-V8-
      Verhalten zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook ist nur für Formatierung. Er staged formatierte Dateien erneut und
      führt weder Lint, Typecheck noch Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor der Übergabe oder vor dem Push aus, wenn Sie
      den intelligenten lokalen Check-Gate benötigen.
    - `pnpm test:changed` wird standardmäßig durch günstige bereichsbezogene Lanes geleitet. Verwenden Sie
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent
      entscheidet, dass eine Harness-, Konfigurations-, Package- oder Vertragsänderung wirklich breitere
      Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
      Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Lokale Worker-Autoskalierung ist absichtlich konservativ und fährt zurück,
      wenn die Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige
      Vitest-Läufe standardmäßig weniger Schaden anrichten.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als
      `forceRerunTriggers`, damit Changed-Mode-Neuläufe korrekt bleiben, wenn sich die Test-
      Verdrahtung ändert.
    - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
      Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
      einen expliziten Cache-Speicherort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Perf-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Importdauer-Reporting plus
      Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf
      Dateien, die seit `origin/main` geändert wurden.
    - Shard-Timing-Daten werden in `.artifacts/vitest-shard-timings.json` geschrieben.
      Whole-Config-Läufe verwenden den Konfigurationspfad als Schlüssel; Include-Pattern-CI-
      Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt werden können.
    - Wenn ein heißer Test weiterhin den Großteil seiner Zeit in Startup-Importen verbringt,
      halten Sie schwere Dependencies hinter einer schmalen lokalen `*.runtime.ts`-Nahtstelle und
      mocken Sie diese Nahtstelle direkt, statt Runtime-Hilfen nur deshalb tief zu importieren,
      um sie an `vi.mock(...)` durchzureichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
      `test:changed` mit dem nativen Root-Project-Pfad für diesen committeten
      Diff und gibt Wall Time plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen
      Dirty Tree, indem die geänderte Dateiliste durch
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geleitet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für
      Vitest-/Vite-Startup- und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU+Heap-Profile für die
      Unit-Suite mit deaktivierter Datei-Parallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, erzwungen auf einen Worker
- Umfang:
  - Startet ein echtes loopback-Gateway mit standardmäßig aktivierten Diagnosen
  - Treibt synthetische Gateway-Nachrichten-, Memory- und Large-Payload-Last durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über das Gateway-WS-RPC ab
  - Deckt Persistenzhilfen für Diagnose-Stabilitätsbundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Pressure-Budget bleiben und die Queue-Tiefen pro Sitzung wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und schlüssellos
  - Schmale Lane für Stabilitätsregressions-Follow-up, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests für gebündelte Plugins unter `extensions/`
- Laufzeit-Standardwerte:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateways mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Kopplung und aufwendigere Netzwerke
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einer temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests für gebündelte Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Provider-Formatänderungen, Besonderheiten beim Tool-Aufruf, Authentifizierungsprobleme und Verhalten bei Ratenbegrenzungen
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / nutzt Ratenlimits
  - Bevorzugen Sie eingegrenzte Teilmengen statt „alles“ auszuführen
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel zu übernehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen leiseren Modus: Die `[live] ...`-Fortschrittsausgabe bleibt erhalten, aber der zusätzliche `~/.profile`-Hinweis wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Meldungen werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startlogs zurückhaben möchten.
- API-Schlüsselrotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Live-spezifische Überschreibung über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Ratenlimit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen auf stderr aus, damit lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Vitest-Konsolenerfassung leise ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, sodass Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Kopplung berühren: Fügen Sie `pnpm test:e2e` hinzu
- „Mein Bot ist ausgefallen“ / Provider-spezifische Fehler / Tool-Aufruf debuggen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smokes, ACP-Smokes, das Harness für den Codex-App-Server und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild, Musik, Video, Medien-Harness) sowie die Zugangsdatenbehandlung für Live-Läufe siehe [Live-Suites testen](/de/help/testing-live). Für die dedizierte Checkliste für Updates und Plugin-Validierung siehe [Updates und Plugins testen](/de/help/testing-updates-plugins).

## Docker-Runner (optionale Prüfungen auf „funktioniert unter Linux“)

Diese Docker-Runner sind in zwei Gruppen unterteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei mit Profil-Schlüsseln im Repo-Docker-Image aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace gemountet werden (und `~/.profile` gesourct wird, falls gemountet). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Begrenzung, damit ein vollständiger Docker-Durchlauf praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Umgebungsvariablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut/verwendet dann zwei `scripts/e2e/Dockerfile`-Images. Das Bare-Image ist nur der Node-/Git-Runner für Installations-/Update-/Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorgebauten Tarball. Das funktionale Image installiert denselben Tarball nach `/app` für Lanes mit Built-App-Funktionalität. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; Planerlogik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenlimits verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer als die aktiven Limits ist, kann der Scheduler sie trotzdem starten, wenn der Pool leer ist, und lässt sie dann allein weiterlaufen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig eine Docker-Vorabprüfung aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Status aus, speichert erfolgreiche Lane-Laufzeiten in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Laufzeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Docker-Build oder -Ausführung auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“ Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt die ausgewählte Ref neu zu packen. Profile sind nach Breite sortiert: `smoke`, `package`, `product` und `full`. Siehe [Updates und Plugins testen](/de/help/testing-updates-plugins) für den Paket-/Update-/Plugin-Vertrag, die Survivor-Matrix für veröffentlichte Upgrades, Release-Standardwerte und Fehlertriage.
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard durchläuft den statischen gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn der Start vor dem Dispatch Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor dem Command-Dispatch importiert; außerdem hält er den gebündelten Gateway-Run-Chunk unter dem Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Der paketierte CLI-Smoke deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Modelllisten-Befehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis einschließlich dieses Stichtags toleriert das Harness nur Metadatenlücken ausgelieferter Pakete: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und Konfigurationsmetadatenmigration während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren übergeordnete Integrationspfade.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Authentifizierungs-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie vor dem Lauf in das Container-Home, damit OAuth externer CLIs Tokens aktualisieren kann, ohne den Authentifizierungsspeicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt Claude, Codex und Gemini standardmäßig ab, mit strikter Droid/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungs-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Test: `pnpm qa:otel:smoke` ist eine private QA-Source-Checkout-Lane. Sie ist absichtlich nicht Teil der Paket-Docker-Release-Lanes, weil der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Channel-/Agent-Smoke-Test: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI per env-ref-Onboarding sowie standardmäßig Telegram, führt doctor aus und führt einen gemockten OpenAI-Agent-Turn aus. Verwenden Sie einen vorab erstellten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie den Channel mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` oder `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Update-Channel-Wechsel-Smoke-Test: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt von Paket-`stable` zu Git-`dev`, prüft den persistierten Channel und die Plugin-Funktion nach dem Update, wechselt dann zurück zu Paket-`stable` und prüft den Update-Status.
- Upgrade-Survivor-Smoke-Test: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über eine verschmutzte Altbenutzer-Fixture mit Agents, Channel-Konfiguration, Plugin-Allowlists, veraltetem Plugin-Abhängigkeitszustand sowie bestehenden Workspace-/Sitzungsdateien. Er führt ein Paket-Update plus nicht interaktiven doctor ohne Live-Provider- oder Channel-Schlüssel aus, startet anschließend ein Loopback-Gateway und prüft die Beibehaltung von Konfiguration/Zustand sowie Startup-/Status-Budgets.
- Published-Upgrade-Survivor-Smoke-Test: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, legt realistische Dateien bestehender Benutzer an, konfiguriert diese Baseline mit einem eingebetteten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf den Kandidaten-Tarball, führt nicht interaktiven doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet dann ein Loopback-Gateway und prüft konfigurierte Intents, Zustandserhalt, Start, `/healthz`, `/readyz` und RPC-Status-Budgets. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, lassen Sie den Aggregat-Scheduler exakte lokale Baselines mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` erweitern und erweitern Sie issue-förmige Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` wie `reported-issues`; das reported-issues-Set enthält `configured-plugin-installs` für automatische Reparatur externer OpenClaw-Plugin-Installationen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit, löst Meta-Baseline-Tokens wie `last-stable-4` oder `all-since-2026.4.23` auf, und Full Release Validation erweitert das Release-Soak-Paket-Gate auf `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Sitzungs-Laufzeitkontext-Smoke-Test: `pnpm test:docker:session-runtime-context` prüft die Persistenz des ausgeblendeten Laufzeitkontext-Transkripts sowie die doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Branches.
- Bun-Global-Install-Smoke-Test: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und prüft, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängenzubleiben. Verwenden Sie einen vorab erstellten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke-Test: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen seinen Root-, Update- und Direct-npm-Containern. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf den Kandidaten-Tarball aktualisiert wird. Überschreiben Sie lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Nicht-Root-Installer-Prüfungen verwenden einen isolierten npm-Cache, damit root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache bei lokalen Wiederholungsläufen wiederzuverwenden.
- Install Smoke CI überspringt das doppelte globale Direct-npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env aus, wenn direkte `npm install -g`-Abdeckung erforderlich ist.
- CLI-Smoke-Test zum Löschen eines gemeinsam genutzten Agent-Workspace: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt zwei Agents mit einem Workspace in einem isolierten Container-Home an, führt `agents delete --json` aus und prüft gültiges JSON sowie das Verhalten beibehaltener Workspaces. Verwenden Sie das install-smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` wieder.
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke-Test: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und prüft, dass CDP-Rollen-Snapshots Link-URLs, zu Clickables hochgestufte Cursor-Ziele, iframe-Referenzen und Frame-Metadaten abdecken.
- OpenAI Responses web_search Regression für minimales Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch Gateway aus, prüft, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann die Ablehnung durch das Provider-Schema und prüft, dass das rohe Detail in Gateway-Logs erscheint.
- MCP-Channel-Bridge (vorbefülltes Gateway + stdio-Bridge + roher Claude-Notification-Frame-Smoke-Test): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow-/Deny-Smoke-Test): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Cleanup (echtes Gateway + stdio-MCP-Child-Teardown nach isolierten Cron- und One-Shot-Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-/Update-Smoke-Test für lokalen Pfad, `file:`, npm-Registry mit gehoisteten Abhängigkeiten, bewegliche Git-Refs, ClawHub-Kitchen-Sink, Marketplace-Updates und Claude-Bundle-Aktivierung/Inspektion): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Paket-/Laufzeit-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Plugin-Update-Unchanged-Smoke-Test: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-Lifecycle-Matrix-Smoke-Test: `pnpm test:docker:plugin-lifecycle-matrix` installiert den gepackten OpenClaw-Tarball in einem leeren Container, installiert ein npm-Plugin, schaltet Aktivieren/Deaktivieren um, führt Upgrade und Downgrade über eine lokale npm-Registry aus, löscht den installierten Code und prüft dann, dass die Deinstallation weiterhin veralteten Zustand entfernt, während RSS-/CPU-Metriken für jede Lifecycle-Phase protokolliert werden.
- Config-Reload-Metadata-Smoke-Test: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Install-/Update-Smoke-Tests für lokalen Pfad, `file:`, npm-Registry mit gehoisteten Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marketplace-Updates und Claude-Bundle-Aktivierung/Inspektion ab. `pnpm test:docker:plugin-update` deckt unverändertes Update-Verhalten für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt ressourcenverfolgte npm-Plugin-Installation, Aktivieren, Deaktivieren, Upgrade, Downgrade und Deinstallation bei fehlendem Code ab.

So erstellen Sie das gemeinsam genutzte funktionale Image vorab und verwenden es manuell wieder:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es nicht bereits lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsam genutzten Built-App-Laufzeit validieren.

Die Live-Model-Docker-Runner binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in einem temporären Arbeitsverzeichnis im Container bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest weiterhin gegen Ihre exakte lokale Quelle/Konfiguration läuft.
Der Staging-Schritt überspringt große, nur lokal relevante Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/etc.-Channel-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-Live-Abdeckung in dieser Docker-Lane
einschränken oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke-Test: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über Open WebUIs Proxy `/api/chat/completions`.
Der erste Lauf kann merklich langsamer sein, da Docker möglicherweise das
Open-WebUI-Image ziehen muss und Open WebUI eventuell seine eigene Kaltstart-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Model-Schlüssel, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist der primäre Weg, ihn in Dockerisierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es bootet einen vorbefüllten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert anschließend die Erkennung gerouteter Unterhaltungen, Transcript-Lesezugriffe, Attachment-Metadaten,
das Verhalten der Live-Event-Warteschlange, Outbound-Send-Routing sowie Claude-artige Channel- und
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, damit der Smoke-Test validiert, was die
Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Model-Schlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools beibehalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Model-
Schlüssel. Es startet ein vorbefülltes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen einmaligen `/subagents spawn`-Child-Turn aus und verifiziert anschließend,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Smoke-Test für Threads in Klartextsprache (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows bei. Es könnte erneut für die ACP-Thread-Routing-Validierung benötigt werden; löschen Sie es daher nicht.

Nützliche Env-Vars:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) eingehängt nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) eingehängt nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) eingehängt nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Env-Vars zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` gesourct wurden, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) eingehängt nach `/home/node/.npm-global` für gecachte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingehängt und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingeschränkte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelles Überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzuschränken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für Wiederholungsläufe wiederzuverwenden, die keinen Neubau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher stammen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke-Test bereitgestellte Model auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke-Test verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den gepinnten Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Docs-Änderungen Docs-Checks aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie auch seiteninterne Heading-Prüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „echte Pipeline“-Regressionen ohne echte Provider:

- Gateway-Tool-Calling (Mock OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Wizard (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Calling über das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Wizard-Flows, die Session-Verkabelung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungslogik:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent dann die richtige Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt er erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme der Session-Historie und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesezugriffe und Session-Verkabelung zu prüfen.
- Eine kleine Suite Skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, env-gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Contract-Tests (Plugin- und Channel-Form)

Contract-Tests verifizieren, dass jeder registrierte Plugin und Channel seinem
Interface-Vertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Form- und Verhaltensassertions aus. Die standardmäßige Unit-Lane von `pnpm test`
überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die Contract-Befehle explizit aus,
wenn Sie gemeinsame Channel- oder Provider-Oberflächen berühren.

### Befehle

- Alle Contracts: `pnpm test:contracts`
- Nur Channel-Contracts: `pnpm test:contracts:channels`
- Nur Provider-Contracts: `pnpm test:contracts:plugins`

### Channel-Contracts

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Setup-Wizard-Vertrag
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Nachrichten-Payload-Struktur
- **inbound** - Inbound-Nachrichtenverarbeitung
- **actions** - Channel-Action-Handler
- **threading** - Thread-ID-Verarbeitung
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Status-Contracts

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-Status-Probes
- **registry** - Plugin-Registry-Form

### Provider-Contracts

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Model-Catalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Interface
- **wizard** - Setup-Wizard

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach dem Refactoring von Plugin-Registrierung oder -Erkennung

Contract-Tests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein Provider-/Model-Problem beheben, das live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassung der exakten Request-Form-Transformation)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng begrenzt und per Env-Vars optional
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Fehler erkennt:
  - Bug bei Provider-Request-Konvertierung/-Replay → direkter Models-Test
  - Bug in Gateway-Session-/History-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse ein gesampeltes Ziel aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und asserts anschließend, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Zielfamilie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
- [CI](/de/ci)
