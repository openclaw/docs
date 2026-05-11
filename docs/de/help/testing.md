---
read_when:
    - Tests lokal oder in der CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Debugging von Gateway- und Agentenverhalten
summary: 'Test-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was die einzelnen Tests abdecken'
title: Testen
x-i18n:
    generated_at: "2026-05-11T20:32:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Anzahl
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten finden und Modelle/Provider auswählen.
- Wie Sie Regressionen für reale Modell-/Provider-Probleme hinzufügen.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Überblick](/de/concepts/qa-e2e-automation) - Architektur, Befehlsoberfläche, Szenarioerstellung.
- [Matrix-QA](/de/concepts/qa-matrix) - Referenz für `pnpm openclaw qa matrix`.
- [QA-Kanal](/de/channels/qa-channel) - das synthetische Transport-Plugin, das von repo-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Testsuiten und Docker/Parallels-Runner. Der QA-spezifische Runner-Abschnitt unten ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die oben genannten Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einem großzügig ausgestatteten Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direkte Dateizielauswahl routet jetzt auch Erweiterungs-/Kanalpfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests berühren oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine Live-Datei leise gezielt ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laufzeit-Performance-Berichte: Starten Sie `OpenClaw Performance` mit
  `live_gpt54=true` für einen echten Agent-Turn mit `openai/gpt-5.4` oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Täglich geplante Läufe
  veröffentlichen Mock-Provider-, Deep-Profile- und GPT-5.4-Lane-Artefakte nach
  `openclaw/clawgrit-reports`, wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist. Der
  Mock-Provider-Bericht enthält außerdem Zahlen zu source-nahem Gateway-Start,
  Speicher, Plugin-Druck, wiederholter Fake-Model-Hello-Schleife und CLI-Start.
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Probe im Stil eines Dateilesevorgangs aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Die täglichen `OpenClaw Scheduled Live And E2E Checks` und manuellen
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live/E2E-Workflow mit
    `include_live_suites: true` auf, was separate Docker-Live-Modell-Matrix-Jobs
    einschließt, die nach Provider geshardet sind.
  - Für fokussierte CI-Wiederholungen starten Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue, signalstarke Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und deren
    geplanten/Release-Aufrufern hinzu.
- Native Codex Bound-Chat-Smoke-Test: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert anschließend, dass eine einfache Antwort und ein Bildanhang
    über das native Plugin-Binding statt über ACP geroutet werden.
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns durch das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Probes aus. Deaktivieren Sie die Sub-Agent-Probe mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet den Lauf nach der Sub-Agent-Probe, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht gesetzt ist.
- Codex-On-Demand-Installations-Smoke-Test: `pnpm test:docker:codex-on-demand`
  - Installiert den paketierten OpenClaw-Tarball in Docker, führt das OpenAI-API-Key-
    Onboarding aus und verifiziert, dass das Codex-Plugin plus die `@openai/codex`-Abhängigkeit
    bei Bedarf in das verwaltete npm-Root heruntergeladen wurden.
- Live-Plugin-Tool-Abhängigkeits-Smoke-Test: `pnpm test:docker:live-plugin-tool`
  - Packt ein Fixture-Plugin mit einer echten `slugify`-Abhängigkeit, installiert es über
    `npm-pack:`, verifiziert die Abhängigkeit unter dem verwalteten npm-Root und bittet dann ein
    Live-OpenAI-Modell, das Plugin-Tool aufzurufen und den versteckten Slug zurückzugeben.
- Crestodian-Rettungsbefehl-Smoke-Test: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit doppelter Absicherung für die Rettungsbefehl-Oberfläche des Nachrichtenkanals.
    Sie übt `/crestodian status` aus, reiht eine persistente Modelländerung ein,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Konfigurations-Schreibpfad.
- Crestodian-Planner-Docker-Smoke-Test: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer Fake-Claude-CLI auf `PATH`
    aus und verifiziert, dass der Fuzzy-Planner-Fallback in einen auditierten typisierten
    Konfigurationsschreibvorgang übersetzt wird.
- Crestodian-First-Run-Docker-Smoke-Test: `pnpm test:docker:crestodian-first-run`
  - Startet aus einem leeren OpenClaw-State-Verzeichnis, routet bloßes `openclaw` zu
    Crestodian, wendet Setup-/Modell-/Agent-/Discord-Plugin- und SecretRef-Schreibvorgänge an,
    validiert die Konfiguration und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad ist
    auch in QA Lab abgedeckt durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-Kosten-Smoke-Test: Führen Sie bei gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus und anschließend einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlgeschlagenen Fall benötigen, bevorzugen Sie das Eingrenzen von Live-Tests über die unten beschriebenen Allowlist-Env-Vars.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttestsuiten, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. Agentische Parität ist unter
`QA-Lab - All Lanes` und Release-Validierung verschachtelt, nicht als eigenständiger PR-Workflow.
Breite Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Checks verwenden. Stable-/Default-Release-
Checks halten umfassenden Live-/Docker-Soak hinter `run_release_soak=true`; das
`full`-Profil erzwingt Soak. `QA-Lab - All Lanes`
läuft nächtlich auf `main` und per manuellem Start mit der Mock-Parity-Lane, Live-
Matrix-Lane, Convex-verwalteter Live-Telegram-Lane und Convex-verwalteter Live-Discord-
Lane als parallele Jobs. Geplante QA- und Release-Checks übergeben Matrix
explizit `--profile fast`, während die Matrix-CLI und der manuelle Workflow-Input
weiterhin standardmäßig `all` verwenden; manuelle Starts können `all` in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`-Jobs sharden. `OpenClaw Release
Checks` führt vor der Release-Freigabe Parität plus die schnelle Matrix- und Telegram-Lanes aus
und verwendet `mock-openai/gpt-5.5` für Release-Transportprüfungen, damit sie
deterministisch bleiben und normalen Provider-Plugin-Start vermeiden. Diese Live-Transport-
Gateways deaktivieren Speichersuche; Speicherverhalten bleibt durch die QA-Parity-
Suiten abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
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
    `--concurrency 1` für den älteren seriellen Prüfpfad.
  - Beendet mit einem Exit-Code ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie
    `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code
    möchten.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für
    experimentelle Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm test:plugins:kitchen-sink-live`
  - Führt den Live-OpenAI-Kitchen-Sink-Plugin-Gauntlet über QA Lab aus. Es
    installiert das externe Kitchen-Sink-Paket, verifiziert das Inventar der
    Plugin-SDK-Oberfläche, prüft `/healthz` und `/readyz`, zeichnet Gateway-CPU/RSS-
    Nachweise auf, führt einen Live-OpenAI-Turn aus und prüft adversarielle Diagnosen.
    Erfordert Live-OpenAI-Auth wie `OPENAI_API_KEY`. In hydratisierten Testbox-
    Sitzungen bezieht es automatisch das Testbox-Live-Auth-Profil, wenn der
    `openclaw-testbox-env`-Helper vorhanden ist.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Start-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte CPU-
    Beobachtungszusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltende Hot-CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startspitzen als Metriken erfasst
    werden, ohne wie die minutenlange Gateway-Peg-Regression auszusehen.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn
    der Checkout noch keine frische Runtime-Ausgabe enthält.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast
    praktikabel sind: env-basierte Provider-Schlüssel, den QA-Live-Provider-
    Config-Pfad und `CODEX_HOME`, wenn vorhanden.
  - Ausgabeverzeichnisse müssen unterhalb des Repo-Roots bleiben, damit der Gast
    über den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht und die Zusammenfassung plus Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatororientierte QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt nichtinteraktives OpenAI-API-Key-Onboarding aus, konfiguriert
    standardmäßig Telegram, verifiziert, dass die paketierte Plugin-Runtime ohne
    Startabhängigkeitsreparatur geladen wird, führt doctor aus und führt einen
    lokalen Agent-Turn gegen einen gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe
    Paketinstallations-Lane mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Built-App-Docker-Smoke für eingebettete
    Runtime-Kontext-Transkripte aus. Es verifiziert, dass versteckter OpenClaw-
    Runtime-Kontext als nicht angezeigte Custom Message persistiert wird, statt
    in den sichtbaren User-Turn zu gelangen, seedet anschließend eine betroffene
    defekte Session-JSONL und verifiziert, dass `openclaw doctor --fix` sie mit
    einem Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt das Onboarding
    des installierten Pakets aus, konfiguriert Telegram über die installierte CLI
    und verwendet dann die Live-Telegram-QA-Lane mit diesem installierten Paket
    als SUT-Gateway wieder.
  - Der Wrapper mountet nur den `qa-lab`-Harness-Quellcode aus dem Checkout; das
    installierte Paket besitzt `dist`, `openclaw/plugin-sdk` und die gebündelte
    Plugin-Runtime, sodass die Lane keine Plugins aus dem aktuellen Checkout in
    das zu testende Paket mischt.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen ein aufgelöstes lokales
    Tarball zu testen, statt aus der Registry zu installieren.
  - Verwendet dieselben Telegram-env-Zugangsdaten oder dieselbe Convex-
    Zugangsdatenquelle wie `pnpm openclaw qa telegram`. Für CI-/Release-
    Automatisierung setzen Sie `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`
    plus `OPENCLAW_QA_CONVEX_SITE_URL` und das Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper automatisch Convex aus.
  - Der Wrapper validiert Telegram- oder Convex-Zugangsdaten-env auf dem Host, bevor
    Docker-Build-/Installationsarbeit beginnt. Setzen Sie `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    nur, wenn Sie bewusst das Setup vor Zugangsdaten debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Sie läuft nicht beim Merge. Der Workflow verwendet die
    `qa-live-shared`-Umgebung und Convex-CI-Zugangsdaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für seitlich ausgeführten
  Produktnachweis gegen ein Kandidatenpaket bereit. Es akzeptiert eine vertrauenswürdige
  Ref, eine veröffentlichte npm-Spezifikation, eine HTTPS-Tarball-URL plus SHA-256
  oder ein Tarball-Artefakt aus einem anderen Lauf, lädt das normalisierte
  `openclaw-current.tgz` als `package-under-test` hoch und führt dann den
  bestehenden Docker-E2E-Scheduler mit Smoke-, Paket-, Produkt-, Full- oder
  benutzerdefinierten Lane-Profilen aus. Setzen Sie `telegram_mode=mock-openai`
  oder `live-frontier`, um den Telegram-QA-Workflow gegen dasselbe
  `package-under-test`-Artefakt auszuführen.
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

- Artefaktnachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet den Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Channel/Plugins über
    Config-Änderungen.
  - Verifiziert, dass Setup-Discovery unkonfigurierte herunterladbare Plugins
    abwesend lässt, die erste konfigurierte doctor-Reparatur jedes fehlende
    herunterladbare Plugin explizit installiert und ein zweiter Neustart keine
    versteckte Abhängigkeitsreparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor
    dem Ausführen von `openclaw update --tag <candidate>` und verifiziert, dass die
    post-update doctor-Prüfung des Kandidaten Legacy-Plugin-Abhängigkeitsreste ohne
    harnessseitige Postinstall-Reparatur bereinigt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Paketinstallations-Update-Smoke über Parallels-Gäste aus.
    Jede ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket,
    führt dann den installierten Befehl `openclaw update` im selben Gast aus und
    verifiziert die installierte Version, den Update-Status, die Gateway-
    Bereitschaft und einen lokalen Agent-Turn.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`,
    während Sie an einem Gast iterieren. Verwenden Sie `--json` für den Pfad des
    Zusammenfassungsartefakts und den Status pro Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für den Live-Agent-
    Turn-Nachweis. Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes OpenAI-Modell
    validieren.
  - Umschließen Sie lange lokale Läufe mit einem Host-Timeout, damit Parallels-
    Transport-Hänger nicht den Rest des Testfensters verbrauchen:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Windows-Updates können auf einem kalten Gast 10 bis 15 Minuten in post-update
    doctor- und Paketupdate-Arbeit verbringen; das ist weiterhin gesund, wenn das
    verschachtelte npm-Debug-Log fortschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel mit einzelnen Parallels-
    macOS-, Windows- oder Linux-Smoke-Lanes aus. Sie teilen sich VM-Zustand und
    können bei Snapshot-Wiederherstellung, Paketbereitstellung oder Gast-Gateway-
    Zustand kollidieren.
  - Der post-update-Nachweis führt die normale gebündelte Plugin-Oberfläche aus,
    weil Capability-Fassaden wie Sprache, Bildgenerierung und Medienverständnis
    über gebündelte Runtime-APIs geladen werden, selbst wenn der Agent-Turn selbst
    nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren Docker-gestützten Tuwunel-Homeserver aus. Nur Quell-Checkout - paketierte Installationen liefern `qa-lab` nicht aus.
  - Vollständige CLI, Profil-/Szenariokatalog, env vars und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Driver- und SUT-Bot-Tokens aus env aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsame gepoolte Zugangsdaten. Verwenden Sie standardmäßig den env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Standards decken Canary, Mention-Gating, Command-Adressierung, `/status`, bot-zu-bot erwähnte Antworten und Core-native Command-Antworten ab. `mock-openai`-Standards decken außerdem deterministische Reply-Chain- und Telegram-Final-Message-Streaming-Regressionen ab. Verwenden Sie `--list-scenarios` für optionale Probes wie `session_status`.
  - Beendet mit einem Exit-Code ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie
    `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code
    möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für stabile Bot-zu-Bot-Beobachtung aktivieren Sie den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Gruppen-Bot-Traffic beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein observed-messages-Artefakt unter `.artifacts/qa-e2e/...`. Antwortende Szenarien enthalten RTT von der Send-Anfrage des Drivers bis zur beobachteten SUT-Antwort.

`Mantis Telegram Live` ist der PR-Nachweis-Wrapper um diese Lane. Er führt die
Kandidaten-Ref mit Convex-geleasten Telegram-Zugangsdaten aus, rendert das
redigierte observed-message-Transkript in einem Crabbox-Desktopbrowser, zeichnet
MP4-Nachweise auf, generiert ein bewegungsgetrimmtes GIF, lädt das Artefaktbundle
hoch und postet Inline-PR-Nachweise über die Mantis GitHub App, wenn `pr_number`
gesetzt ist. Maintainer können ihn über die Actions-UI mit `Mantis Scenario`
(`scenario_id:
telegram-live`) oder direkt aus einem Pull-Request-Kommentar starten:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` ist der agentische native Telegram-Desktop-
Before/After-Wrapper für visuellen PR-Nachweis. Starten Sie ihn über die Actions-
UI mit freien `instructions`, über `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) oder aus einem PR-Kommentar:

```text
@Mantis telegram desktop proof
```

Der Mantis-Agent liest den PR, entscheidet, welches in Telegram sichtbare Verhalten die
Änderung nachweist, führt die Real-User-Crabbox-Telegram-Desktop-Proof-Lane auf Baseline- und
Kandidaten-Refs aus, iteriert, bis die nativen GIFs brauchbar sind, schreibt ein gepaartes
`motionPreview`-Manifest und postet dieselbe zweispaltige GIF-Tabelle über die
Mantis GitHub App, wenn `pr_number` gesetzt ist.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Least oder verwendet einen Crabbox-Linux-Desktop wieder, installiert das native Telegram Desktop, konfiguriert OpenClaw mit einem geleasten Telegram-SUT-Bot-Token, startet das Gateway und zeichnet Screenshot-/MP4-Nachweise vom sichtbaren VNC-Desktop auf.
  - Standardmäßig `--credential-source convex`, sodass Workflows nur das Convex-Broker-Secret benötigen. Verwenden Sie `--credential-source env` mit denselben `OPENCLAW_QA_TELEGRAM_*`-Variablen wie `pnpm openclaw qa telegram`.
  - Telegram Desktop benötigt weiterhin eine Benutzeranmeldung bzw. ein Profil. Das Bot-Token konfiguriert nur OpenClaw. Verwenden Sie `--telegram-profile-archive-env <name>` für ein base64-`.tgz`-Profilarchiv, oder verwenden Sie `--keep-lease` und melden Sie sich einmal manuell über VNC an.
  - Schreibt `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` und `telegram-desktop-builder.mp4` unterhalb des Ausgabeverzeichnisses.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht abweichen; die Abdeckungsmatrix pro Lane befindet sich unter [QA-Übersicht → Live-Transport-Abdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und nicht Teil dieser Matrix.

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
Live-Transport-QA aktiviert ist, bezieht das QA-Lab eine exklusive Lease aus einem Convex-gestützten Pool, sendet Heartbeats für diese
Lease, während die Lane läuft, und gibt die Lease beim Herunterfahren frei. Der Abschnittsname stammt aus der Zeit vor
Discord-, Slack- und WhatsApp-Unterstützung; der Lease-Vertrag wird über Arten hinweg gemeinsam genutzt.

Referenz-Scaffold für Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standardwert: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, andernfalls `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs für rein lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Admin-Befehle für Wartende (Pool hinzufügen/entfernen/auflisten) erfordern
ausdrücklich `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfen für Wartende:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um Convex-Site-URL, Broker-Secrets,
Endpoint-Präfix, HTTP-Timeout und Erreichbarkeit von Admin/List zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-
Hilfsprogrammen.

Standard-Endpoint-Vertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Erfolg: `{ status: "ok", index, data }`
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
  - Schutz bei aktiver Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer Telegram-Chat-ID-String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

Payload-Form für Telegram-Real-User-Art:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` und `telegramApiId` müssen numerische Strings sein.
- `tdlibArchiveSha256` und `desktopTdataArchiveSha256` müssen SHA-256-Hex-Strings sein.
- `kind: "telegram-user"` repräsentiert ein Telegram-Burner-Konto. Behandeln Sie die Lease als kontoweit: Der TDLib-CLI-Treiber und der visuelle Zeuge in Telegram Desktop werden aus derselben Payload wiederhergestellt, und immer nur ein Job sollte die Lease halten.

Telegram-Real-User-Lease wiederherstellen:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Verwenden Sie das wiederhergestellte Desktop-Profil mit `Telegram -workdir "$tmp/desktop"`, wenn eine visuelle Aufzeichnung benötigt wird. In lokalen Operator-Umgebungen liest `scripts/e2e/telegram-user-credential.ts` standardmäßig `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`, wenn Prozessumgebungsvariablen fehlen.

Agentengesteuerte Crabbox-Sitzung:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` least die `telegram-user`-Anmeldedaten, stellt dasselbe Konto in
TDLib und Telegram Desktop auf einem Crabbox-Linux-Desktop wieder her, startet ein lokales Mock-SUT-
Gateway aus dem aktuellen Checkout, öffnet den sichtbaren Telegram-Chat, startet die
Desktop-Aufzeichnung und schreibt eine private `session.json`. Solange die Sitzung
aktiv ist, kann ein Agent weiter testen, bis er zufrieden ist:

- `send --session <file> --text <message>` sendet über den echten TDLib-Benutzer und wartet auf die SUT-Antwort.
- `run --session <file> -- <remote command>` führt einen beliebigen Befehl auf der Crabbox aus und speichert dessen Ausgabe, zum Beispiel `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` erfasst den aktuell sichtbaren Desktop.
- `status --session <file>` gibt die Lease und den WebVNC-Befehl aus.
- `finish --session <file>` stoppt den Recorder, erfasst Screenshot-/Video-/Motion-Trim-Artefakte, gibt die Convex-Anmeldedaten frei, stoppt lokale SUT-Prozesse und stoppt die Crabbox-Lease, sofern nicht `--keep-box` übergeben wurde.
- `publish --session <file> --pr <number>` veröffentlicht standardmäßig einen reinen GIF-PR-Kommentar. Übergeben Sie `--full-artifacts` nur, wenn Logs oder JSON-Artefakte absichtlich benötigt werden.

Für deterministische visuelle Repros übergeben Sie `--mock-response-file <path>` an `start`
oder an die Ein-Befehl-Kurzform `probe`. Der Runner verwendet standardmäßig eine Standard-
Crabbox-Klasse, Aufzeichnung mit 24 fps, Motion-GIF-Vorschauen mit 24 fps und 1920 px GIF-
Breite. Überschreiben Sie dies mit `--class`, `--record-fps`, `--preview-fps` und
`--preview-width` nur, wenn der Nachweis andere Erfassungseinstellungen benötigt.

Ein-Befehl-Crabbox-Nachweis:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Der Standardbefehl `probe` ist die Kurzform für einen einzelnen Start/Senden/Abschluss-Zyklus. Verwenden
Sie ihn für einen schnellen `/status`-Smoke. Verwenden Sie die Sitzungsbefehle für PR-Reviews,
Bug-Reproduktionsarbeit oder jeden Fall, in dem der Agent minutenlange beliebige
Experimente benötigt, bevor entschieden wird, dass der Nachweis vollständig ist. Verwenden Sie `--id <cbx_...>`, um
eine warme Desktop-Lease wiederzuverwenden, `--keep-box`, um VNC nach dem Abschluss offen zu halten,
`--desktop-chat-title <name>`, um den sichtbaren Chat auszuwählen, und `--tdlib-url <tgz>`,
wenn ein vorgefertigtes Linux-`libtdjson.so`-Archiv verwendet wird, statt TDLib auf
einer frischen Box zu bauen. Der Runner verifiziert `--tdlib-url` mit `--tdlib-sha256 <hex>` oder,
standardmäßig, mit einer benachbarten `<url>.sha256`-Datei.

Broker-validierte Mehrkanal-Payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-Lanes können ebenfalls aus dem Pool leasen, aber die Slack-Payload-Validierung
befindet sich derzeit im Slack-QA-Runner statt im Broker. Verwenden Sie
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
für Slack-Zeilen.

### Einen Kanal zu QA hinzufügen

Die Architektur und die Namen der Szenario-Hilfen für neue Kanaladapter befinden sich unter [QA-Übersicht → Einen Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Die Mindestanforderung: Implementieren Sie den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam, deklarieren Sie `qaRunners` im Plugin-Manifest, mounten Sie ihn als `openclaw qa <runner>` und schreiben Sie Szenarien unter `qa/scenarios/`.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden das `vitest.full-*.config.ts`-Shard-Set und können Multi-Projekt-Shards für paralleles Scheduling in projektbezogene Konfigurationen erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten `unit-ui`-Shard
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites `api.js`- und
    `runtime-api.js`-Fallback-Verhalten mit generierten kleinen Plugin-Fixtures nachweisen, nicht mit
    echten gebündelten Plugin-Source-APIs. Echte Plugin-API-Ladevorgänge gehören in
    Plugin-eigene Vertrags-/Integrationssuiten.

Richtlinie für native Abhängigkeiten:

- Standard-Testinstallationen überspringen optionale native Discord-Opus-Builds. Discord-Sprach-Empfang verwendet den reinen JS-Decoder `opusscript`, und `@discordjs/opus` bleibt in `allowBuilds` deaktiviert, damit lokale Tests und Testbox-Lanes das native Add-on nicht kompilieren.
- Verwenden Sie eine dedizierte Discord-Sprach-Performance- oder Live-Lane, wenn Sie bewusst einen nativen Opus-Build vergleichen müssen. Setzen Sie `@discordjs/opus` in den standardmäßigen `allowBuilds` nicht auf `true`; dadurch würden nicht zusammenhängende Installations-/Test-Loops nativen Code kompilieren.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Nicht gezielte `pnpm test`-Läufe führen zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen großen nativen Root-Projekt-Prozesses aus. Das reduziert die Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Extension-Arbeit nicht zusammenhängende Suites ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-Projektgraphen `vitest.config.ts`, da ein Multi-Shard-Watch-Loop nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollständigen Startkosten des Root-Projekts trägt.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu günstigen bereichsbezogenen Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Source-Zuordnungen und lokale Importgraph-Abhängige. Config-/Setup-/Package-Änderungen führen keine breiten Testläufe aus, außer Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Check-Gate für schmale Arbeiten. Es klassifiziert den Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Vitest-Tests werden nicht ausgeführt; rufen Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise auf. Reine Release-Metadaten-Versionsanhebungen führen gezielte Versions-/Config-/Root-Dependency-Checks aus, mit einem Guard, der Package-Änderungen außerhalb des obersten Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Live-Docker-Scheduler-Dry-Run. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` begrenzt ist; Dependency-, Export-, Versions- und andere Package-Oberflächenänderungen verwenden weiterhin die breiteren Guards.
    - Importarme Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helpers, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Helper-Quelldateien ordnen Changed-Mode-Läufe außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Helper-Änderungen nicht erneut die vollständige schwere Suite für dieses Verzeichnis ausführen.
    - `auto-reply` hat dedizierte Buckets für Core-Helper auf oberster Ebene, `reply.*`-Integrationstests auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards auf, damit ein importlastiger Bucket nicht den gesamten Node-Nachlauf übernimmt.
    - Normale PR-/Main-CI überspringt bewusst den Extension-Batch-Sweep und den release-only `agentic-plugins`-Shard. Full Release Validation löst für diese Plugin-/Extension-lastigen Suites auf Release-Kandidaten den separaten Child-Workflow `Plugin Prerelease` aus.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Discovery-Eingaben des Message-Tools oder Compaction-Runtime-Kontext ändern, behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Helper-Regressionen für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halten Sie die Integrations-Suites des eingebetteten Runners gesund:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites prüfen, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin durch die echten `run.ts`- / `compact.ts`-Pfade fließen; reine Helper-Tests sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool und Isolationsstandards">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den nicht isolierten Runner in Root-Projekten, E2E- und Live-Konfigurationen.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard übernimmt dieselben Standards `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt für Vitest-Child-Node-Prozesse standardmäßig `--no-maglev` hinzu, um bei großen lokalen Läufen V8-Kompilieraufwand zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8 zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook formatiert nur. Er staged formatierte Dateien erneut und führt weder Lint noch Typecheck oder Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn Sie das intelligente lokale Check-Gate benötigen.
    - `pnpm test:changed` läuft standardmäßig über günstige bereichsbezogene Lanes. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent entscheidet, dass eine Harness-, Config-, Package- oder Contract-Änderung wirklich breitere Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit höherem Worker-Limit.
    - Die lokale automatische Worker-Skalierung ist bewusst konservativ und reduziert die Last, wenn die Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden verursachen.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Config-Dateien als `forceRerunTriggers`, damit Changed-Mode-Reruns korrekt bleiben, wenn sich Testverdrahtung ändert.
    - Die Config lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Importdauer-Reporting plus Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
    - Shard-Timing-Daten werden nach `.artifacts/vitest-shard-timings.json` geschrieben. Whole-Config-Läufe verwenden den Config-Pfad als Schlüssel; Include-Pattern-CI-Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt werden können.
    - Wenn ein heißer Test weiterhin den Großteil seiner Zeit in Startup-Imports verbringt, halten Sie schwere Dependencies hinter einer schmalen lokalen `*.runtime.ts`-Naht und mocken Sie diese Naht direkt, statt Runtime-Helpers nur dafür tief zu importieren, um sie durch `vi.mock(...)` zu reichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Projekt-Pfad für diesen committed Diff und gibt Wall Time plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen Dirty Tree, indem die geänderte Dateiliste durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für Vitest-/Vite-Startup- und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU- und Heap-Profile für die Unit-Suite mit deaktivierter Datei-Parallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet standardmäßig ein echtes Loopback-Gateway mit aktivierter Diagnose
  - Treibt synthetischen Gateway-Nachrichten-, Memory- und Large-Payload-Durchsatz durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über das Gateway-WS-RPC ab
  - Deckt Persistenz-Helper für Diagnose-Stabilitäts-Bundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Pressure-Budget bleiben und Queue-Tiefen pro Sitzung wieder auf null ablaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Schmale Lane für Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Runtime-Standards:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` zum Erzwingen der Worker-Anzahl (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1` zum erneuten Aktivieren ausführlicher Konsolenausgabe.
- Umfang:
  - End-to-End-Verhalten mehrerer Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwerere Netzwerkarbeit
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Übt OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Ausführung aus
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend Test-Gateway und Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` zum Aktivieren des Tests, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` zum Verweisen auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - "Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?"
  - Erfasst Änderungen am Provider-Format, Eigenheiten beim Tool-Aufruf, Authentifizierungsprobleme und Verhalten bei Rate Limits
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzugen Sie eingegrenzte Teilmengen statt "alles"
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Die `[live] ...`-Fortschrittsausgabe bleibt erhalten, aber der zusätzliche `~/.profile`-Hinweis wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Meldungen werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startlogs wiederhaben möchten.
- API-Schlüsselrotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen Live-spezifischen Override über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen an stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv sind, auch wenn Vitests Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert Vitests Konsolenabfangung, damit Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Pairing anfassen: Ergänzen Sie `pnpm test:e2e`
- "Mein Bot ist ausgefallen" / Provider-spezifische Fehler / Tool-Aufrufe debuggen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests mit Netzwerkzugriff

Informationen zur Live-Modellmatrix, zu CLI-Backend-Smokes, ACP-Smokes, zum Codex-App-Server-
Harness und zu allen Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) - plus Zugangsdatenbehandlung für Live-Läufe - finden Sie unter
[Live-Suites testen](/de/help/testing-live). Die dedizierte Update- und
Plugin-Validierungscheckliste finden Sie unter
[Updates und Plugins testen](/de/help/testing-updates-plugins).

## Docker-Runner (optionale "funktioniert unter Linux"-Prüfungen)

Diese Docker-Runner sind in zwei Gruppen aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Profilschlüssel-Live-Datei im Repo-Docker-Image aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`) und mounten Ihr lokales Konfigurationsverzeichnis sowie den Workspace (und sourcen `~/.profile`, falls gemountet). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Durchlauf praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Umgebungsvariablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan wünschen.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal über `scripts/package-openclaw-for-docker.mjs` als npm-Tarball und baut/verwendet dann zwei `scripts/e2e/Dockerfile`-Images. Das Bare-Image ist nur der Node-/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorgebauten Tarball. Das funktionale Image installiert denselben Tarball nach `/app` für Built-App-Funktionalitäts-Lanes. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer ist als die aktiven Obergrenzen, kann der Scheduler sie dennoch starten, wenn der Pool leer ist, und sie dann allein laufen lassen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig einen Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Status aus, speichert erfolgreiche Lane-Zeiten in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Zeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Build oder Docker-Ausführung auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für "funktioniert dieser installierbare Tarball als Produkt?" Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes genau gegen diesen Tarball aus, statt die ausgewählte Referenz neu zu packen. Profile sind nach Breite geordnet: `smoke`, `package`, `product` und `full`. Den Paket-/Update-/Plugin-Vertrag, die Matrix für veröffentlichte Upgrade-Survivor, Release-Standards und Fehlertriage finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard durchläuft den statisch gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn der Pre-Dispatch-Start Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor der Befehlsweiterleitung importiert; außerdem hält er den gebündelten Gateway-Run-Chunk unter Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Der Packaged-CLI-Smoke deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Model-List-Befehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert das Harness nur Metadatenlücken ausgelieferter Pakete: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patchdateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, ältere Plugin-Install-Record-Speicherorte, fehlende Persistenz von Marketplace-Install-Records und Konfigurationsmetadatenmigration während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren höherstufige Integrationspfade.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit externe CLI-OAuth Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungsagent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Test: `pnpm qa:otel:smoke` ist ein privater QA-Quell-Checkout-Prüflauf. Er ist absichtlich nicht Teil der Docker-Release-Prüfläufe für Pakete, weil der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Channel-/Agent-Smoke-Test: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI über env-ref-Onboarding sowie standardmäßig Telegram, führt doctor aus und führt eine gemockte OpenAI-Agent-Runde aus. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` erneut, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oder wechseln Sie den Channel mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` oder `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Skill-Install-Smoke-Test: `pnpm test:docker:skill-install` installiert den gepackten OpenClaw-Tarball global in Docker, deaktiviert hochgeladene Archivinstallationen in der Konfiguration, löst den aktuellen Live-ClawHub-Skill-Slug aus der Suche auf, installiert ihn mit `openclaw skills install` und verifiziert den installierten Skill sowie `.clawhub`-Origin-/Lock-Metadaten.
- Update-Channel-Wechsel-Smoke-Test: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt von Paket `stable` zu Git `dev`, verifiziert den persistierten Channel und die Plugin-Arbeit nach dem Update, wechselt dann zurück zu Paket `stable` und prüft den Update-Status.
- Upgrade-Survivor-Smoke-Test: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über ein verunreinigtes Fixture eines alten Benutzers mit Agenten, Channel-Konfiguration, Plugin-Allowlists, veraltetem Plugin-Abhängigkeitszustand und vorhandenen Workspace-/Session-Dateien. Es führt ein Paket-Update plus nicht interaktiven doctor ohne Live-Provider- oder Channel-Schlüssel aus, startet dann einen loopback-Gateway und prüft Konfigurations-/Zustandserhalt sowie Startup-/Status-Budgets.
- Published-Upgrade-Survivor-Smoke-Test: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, legt realistische vorhandene Benutzerdateien an, konfiguriert diese Baseline mit einem eingebauten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf den Kandidaten-Tarball, führt nicht interaktiven doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet dann einen loopback-Gateway und prüft konfigurierte Intents, Zustandserhalt, Startup, `/healthz`, `/readyz` und RPC-Status-Budgets. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, lassen Sie den aggregierten Scheduler exakte lokale Baselines mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` erweitern, etwa `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, und erweitern Sie issue-förmige Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, etwa `reported-issues`; das Set `reported-issues` enthält `configured-plugin-installs` für automatische Reparatur externer OpenClaw-Plugin-Installationen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit, löst Meta-Baseline-Token wie `last-stable-4` oder `all-since-2026.4.23` auf, und Full Release Validation erweitert das release-soak-Paket-Gate auf `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Session-Laufzeitkontext-Smoke-Test: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz versteckter Laufzeitkontext-Transkripte plus doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Zweige.
- Bun-Global-Install-Smoke-Test: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängenzubleiben. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` erneut, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke-Test: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache über seine Root-, Update- und direct-npm-Container hinweg. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf den Kandidaten-Tarball aktualisiert wird. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/direct-npm-Cache über lokale Wiederholungen hinweg wiederzuverwenden.
- Install-Smoke-CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env aus, wenn direkte `npm install -g`-Abdeckung benötigt wird.
- Agents-delete-shared-workspace-CLI-Smoke-Test: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt zwei Agenten mit einem Workspace in einem isolierten Container-Home an, führt `agents delete --json` aus und verifiziert gültiges JSON plus Verhalten mit beibehaltenem Workspace. Verwenden Sie das install-smoke-Image erneut mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke-Test: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, per Cursor hochgestufte klickbare Elemente, iframe-Referenzen und Frame-Metadaten abdecken.
- OpenAI-Responses-web_search-Regression mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server über Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann die Provider-Schema-Ablehnung und prüft, dass das rohe Detail in Gateway-Logs erscheint.
- MCP-Channel-Bridge (vorbereiteter Gateway + stdio-Bridge + roher Claude-notification-frame-Smoke-Test): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow-/Deny-Smoke-Test): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Bereinigung (echter Gateway + stdio-MCP-Child-Teardown nach isoliertem Cron und einmaligen Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-/Update-Smoke-Test für lokalen Pfad, `file:`, npm-Registry mit hoisted Dependencies, bewegliche Git-Refs, ClawHub-Kitchen-Sink, Marketplace-Updates und Claude-Bundle-Aktivierung/-Inspektion): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Paket-/Laufzeitpaar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Plugin-Update-Unchanged-Smoke-Test: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-Lifecycle-Matrix-Smoke-Test: `pnpm test:docker:plugin-lifecycle-matrix` installiert den gepackten OpenClaw-Tarball in einem blanken Container, installiert ein npm-Plugin, schaltet enable/disable um, führt Upgrades und Downgrades über eine lokale npm-Registry durch, löscht den installierten Code und verifiziert dann, dass uninstall weiterhin veralteten Zustand entfernt, während RSS-/CPU-Metriken für jede Lifecycle-Phase protokolliert werden.
- Config-Reload-Metadaten-Smoke-Test: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Install-/Update-Smoke-Tests für lokalen Pfad, `file:`, npm-Registry mit hoisted Dependencies, bewegliche Git-Refs, ClawHub-Fixtures, Marketplace-Updates und Claude-Bundle-Aktivierung/-Inspektion ab. `pnpm test:docker:plugin-update` deckt unverändertes Update-Verhalten für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt ressourcenverfolgte npm-Plugin-Installation, Aktivierung, Deaktivierung, Upgrade, Downgrade und Deinstallation bei fehlendem Code ab.

So bauen Sie das gemeinsame funktionale Image manuell vor und verwenden es erneut:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Überschreibungen wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsam gebauten App-Laufzeit validieren.

Die Live-Model-Docker-Runner mounten außerdem den aktuellen Checkout schreibgeschützt und
stellen ihn in einem temporären Arbeitsverzeichnis im Container bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihre exakte lokale Source-/Konfigurationsbasis läuft.
Der Staging-Schritt überspringt große lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/etc.-Channel-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus. Reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-Live-Abdeckung in dieser Docker-Lane
eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open WebUI-Container gegen diesen Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den `/api/chat/completions`-Proxy von Open WebUI.
Setzen Sie `OPENWEBUI_SMOKE_MODE=models` für Release-Pfad-CI-Prüfungen, die nach
Open WebUI-Anmeldung und Model-Erkennung stoppen sollen, ohne auf eine Live-Model-
Completion zu warten.
Der erste Lauf kann merklich langsamer sein, weil Docker möglicherweise das
Open WebUI-Image ziehen muss und Open WebUI eventuell erst sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Model-Schlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Dockerisierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen seeded Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Konversationserkennung, Transcript-Lesevorgänge, Attachment-Metadaten,
Live-Event-Queue-Verhalten, Outbound-Send-Routing sowie Claude-artige Channel- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, damit der Smoke validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-Model-
Schlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie filtern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Model-
Schlüssel. Es startet einen seeded Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen `/subagents spawn`-One-Shot-Child-Turn aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Plain-Language-Thread-Smoke (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es kann erneut für die ACP-Thread-Routing-Validierung benötigt werden, löschen Sie es daher nicht.

Nützliche Env-Vars:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) gemountet nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) gemountet nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) gemountet nach `/home/node/.profile` und vor der Testausführung gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur aus `OPENCLAW_PROFILE_FILE` gesourcte Env-Vars zu verifizieren, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) gemountet nach `/home/node/.npm-global` für gecachte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um für Wiederholungsläufe, die keinen Neubau benötigen, ein vorhandenes `openclaw:local-live`-Image wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldeinformationen aus dem Profile Store kommen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open WebUI-Smoke bereitgestellte Model auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den gepinnten Open WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Docs-Änderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anker-Validierung aus, wenn Sie auch Prüfungen von Überschriften innerhalb der Seite benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (Mock-OpenAI, echter Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Wizard (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Calling über den echten Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Wizard-Flows, die Session-Verdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungslogik:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Multi-Turn-Szenarien, die Tool-Reihenfolge, Session-History-Übernahme und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesevorgänge und Session-Verdrahtung zu prüfen.
- Eine kleine Suite skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, env-gated) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Form)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder registrierte Channel seinem
Interface-Vertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite von
Form- und Verhaltens-Assertions aus. Die standardmäßige `pnpm test`-Unit-Lane überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Channel- oder Provider-Oberflächen ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Capabilities)
- **setup** - Setup-Wizard-Vertrag
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Message-Payload-Struktur
- **inbound** - Inbound-Message-Verarbeitung
- **actions** - Channel-Action-Handler
- **threading** - Thread-ID-Verarbeitung
- **directory** - Directory-/Roster-API
- **group-policy** - Group-Policy-Durchsetzung

### Provider-Status-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-Status-Probes
- **registry** - Plugin-Registry-Form

### Provider-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Model-Catalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/-Interface
- **wizard** - Setup-Wizard

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein Provider-/Model-Problem beheben, das live entdeckt wurde:

- Fügen Sie möglichst eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassung der exakten Request-Shape-Transformation)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Policies), halten Sie den Live-Test eng gefasst und opt-in über Env-Vars
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Bug abfängt:
  - Provider-Request-Conversion-/Replay-Bug → direkter Models-Test
  - Gateway-Session-/History-/Tool-Pipeline-Bug → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse ein gesampeltes Ziel aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und assertet dann, dass Traversal-Segment-Exec-IDs abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Zielfamilie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
- [CI](/de/ci)
