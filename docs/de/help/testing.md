---
read_when:
    - Tests lokal oder in CI ausführen
    - Hinzufügen von Regressionen für Modell-/Provider-Fehler
    - Debugging von Gateway- und Agent-Verhalten
summary: 'Test-Kit: Unit-/E2E-/Live-Test-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-06-27T17:36:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Gruppe
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle für gängige Workflows auszuführen sind (lokal, vor dem Push, Debugging).
- Wie Live-Tests Anmeldedaten finden und Modelle/Provider auswählen.
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Überblick](/de/concepts/qa-e2e-automation) - Architektur, Befehlsoberfläche, Szenarioerstellung.
- [Matrix-QA](/de/concepts/qa-matrix) - Referenz für `pnpm openclaw qa matrix`.
- [Reifegrad-Scorecard](/de/maturity/scorecard) - wie Release-QA-Nachweise Stabilitäts- und LTS-Entscheidungen unterstützen.
- [QA-Kanal](/de/channels/qa-channel) - das synthetische Transport-Plugin, das von repo-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Test-Suiten und Docker-/Parallels-Runner. Der QA-spezifische Runner-Abschnitt unten ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die obigen Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einem großzügig ausgestatteten Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Datei-Targeting leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Seite: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests berühren oder zusätzliche Sicherheit wünschen:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

## Temporäre Testverzeichnisse

Bevorzugen Sie die gemeinsamen Helper in `test/helpers/temp-dir.ts` für testeigene
temporäre Verzeichnisse. Sie machen Eigentümerschaft explizit und halten die Bereinigung im selben
Test-Lebenszyklus:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Verwenden Sie `makeTempDir(tempDirs, prefix)` und `cleanupTempDirs(tempDirs)`, wenn ein Test
bereits ein Array oder Set von Pfaden besitzt. Vermeiden Sie neue nackte `fs.mkdtemp*`-Aufrufe in
Tests, es sei denn, ein Fall prüft ausdrücklich rohes Temp-Dir-Verhalten. Fügen Sie einen
auditierbaren Allow-Kommentar mit einem konkreten Grund hinzu, wenn ein Test absichtlich ein
nacktes temporäres Verzeichnis benötigt:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Für Migrationssichtbarkeit meldet `node scripts/report-test-temp-creations.mjs`
neue nackte Temp-Dir-Erstellung in hinzugefügten Diff-Zeilen, ohne bestehende Bereinigungsstile
zu blockieren. Sein Dateiscope folgt absichtlich derselben Testpfad-Klassifizierung,
die von `scripts/changed-lanes.mjs` verwendet wird, statt eine separate Test-Helper-
Dateinamensheuristik zu pflegen, während die gemeinsame Helper-Implementierung selbst übersprungen wird.
`check:changed` führt diesen Bericht für geänderte Testpfade als warnungsreines CI-
Signal aus; Befunde sind GitHub-Warnungsannotationen, keine Fehler.

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine Live-Datei gezielt und still ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laufzeit-Performance-Berichte: Starten Sie `OpenClaw Performance` mit
  `live_openai_candidate=true` für einen echten `openai/gpt-5.5`-Agent-Turn oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Täglich geplante Läufe
  veröffentlichen Mock-Provider-, Deep-Profile- und GPT-5.5-Lane-Artefakte nach
  `openclaw/clawgrit-reports`, wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist. Der
  Mock-Provider-Bericht enthält außerdem Zahlen zu Gateway-Boot auf Source-Ebene, Speicher,
  Plugin-Druck, wiederholter Fake-Model-Hello-Schleife und CLI-Start.
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Probe im Stil eines Datei-Lesezugriffs aus.
    Modelle, deren Metadaten `image`-Eingabe angeben, führen außerdem einen winzigen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Coverage: Tägliche `OpenClaw Scheduled Live And E2E Checks` und manuelle
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live/E2E-Workflow mit
    `include_live_suites: true` auf; dies umfasst separate Docker-Live-Modell-
    Matrix-Jobs, nach Provider geshardet.
  - Für fokussierte CI-Wiederholungen starten Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue signalstarke Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und deren
    geplanten/Release-Aufrufern hinzu.
- Native Codex Bound-Chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert dann eine einfache Antwort und einen Bildanhang,
    die über die native Plugin-Bindung statt über ACP laufen.
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns durch das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Probes aus. Deaktivieren Sie die Sub-Agent-Probe mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet nach der Sub-Agent-Probe, sofern nicht
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` gesetzt ist.
- Codex-On-Demand-Install-Smoke: `pnpm test:docker:codex-on-demand`
  - Installiert das gepackte OpenClaw-Tarball in Docker, führt das Onboarding per OpenAI-API-Schlüssel aus
    und verifiziert, dass das Codex-Plugin plus `@openai/codex`-Abhängigkeit
    bei Bedarf in das verwaltete npm-Projekt-Root heruntergeladen wurden.
- Live-Plugin-Tool-Abhängigkeits-Smoke: `pnpm test:docker:live-plugin-tool`
  - Packt ein Fixture-Plugin mit einer echten `slugify`-Abhängigkeit, installiert es über
    `npm-pack:`, verifiziert die Abhängigkeit unter dem verwalteten npm-Projekt-Root,
    bittet dann ein Live-OpenAI-Modell, das Plugin-Tool aufzurufen und den versteckten
    Slug zurückzugeben.
- Crestodian-Rettungsbefehls-Smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit Gürtel und Hosenträgern für die Oberfläche des Rettungsbefehls im Nachrichtenkanal.
    Sie übt `/crestodian status` aus, stellt eine persistente Modelländerung in die Warteschlange,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Config-Schreibpfad.
- Crestodian-Planner-Docker-Smoke: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer gefälschten Claude-CLI auf `PATH`
    aus und verifiziert, dass der fuzzy Planner-Fallback in einen auditierten typisierten
    Config-Schreibvorgang übersetzt wird.
- Crestodian-First-Run-Docker-Smoke: `pnpm test:docker:crestodian-first-run`
  - Startet aus einem leeren OpenClaw-State-Verzeichnis, verifiziert den modernen Onboard-
    Crestodian-Einstiegspunkt, wendet Setup-/Modell-/Agent-/Discord-Plugin- + SecretRef-
    Schreibvorgänge an, validiert die Config und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-
    Pfad wird auch in QA Lab durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` abgedeckt.
- Moonshot/Kimi-Kosten-Smoke: Führen Sie mit gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus, führen Sie dann einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6` aus. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistententranskript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlschlagenden Fall benötigen, bevorzugen Sie das Eingrenzen von Live-Tests über die unten beschriebenen Allowlist-Env-Vars.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suiten, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. Agentic-Parität ist unter
`QA-Lab - All Lanes` und Release-Validierung verschachtelt, kein eigenständiger PR-Workflow.
Breite Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Checks verwenden. Stabile/standardmäßige Release-
Checks halten erschöpfendes Live-/Docker-Soak hinter `run_release_soak=true`; das
`full`-Profil erzwingt Soak. `QA-Lab - All Lanes`
läuft nächtlich auf `main` und per manuellem Dispatch mit der Mock-Parity-Lane, Live-
Matrix-Lane, Convex-verwalteter Live-Telegram-Lane und Convex-verwalteter Live-Discord-
Lane als parallele Jobs. Geplante QA- und Release-Checks übergeben Matrix
explizit `--profile fast`, während die Matrix-CLI und die manuelle Workflow-Eingabe
standardmäßig `all` bleiben; manueller Dispatch kann `all` in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`-Jobs sharden. `OpenClaw Release
Checks` führt vor der Release-Freigabe Parität plus die schnellen Matrix- und Telegram-Lanes aus
und verwendet `mock-openai/gpt-5.5` für Release-Transport-Checks, damit diese
deterministisch bleiben und den normalen Provider-Plugin-Start vermeiden. Diese Live-Transport-
Gateways deaktivieren die Speichersuche; Speicherverhalten bleibt durch die QA-Parity-
Suiten abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
Image `ghcr.io/openclaw/openclaw-live-test:<sha>`, das einmal pro ausgewähltem
Commit gebaut wird, und ziehen es dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, statt es
in jedem Shard neu zu bauen.

- `pnpm openclaw qa suite`
  - Führt repositorygestützte QA-Szenarien direkt auf dem Host aus.
  - Schreibt Artefakte auf oberster Ebene: `qa-evidence.json`, `qa-suite-summary.json` und
    `qa-suite-report.md` für die ausgewählte Szenariomenge, einschließlich
    gemischter Flow-, Vitest- und Playwright-Szenarioauswahlen.
  - Wenn durch `pnpm openclaw qa run --qa-profile <profile>` gestartet, bettet es die
    Scorecard des ausgewählten Taxonomieprofils in dieselbe `qa-evidence.json` ein.
    `smoke-ci` schreibt schlanke Nachweise, setzt dabei `evidenceMode: "slim"` und lässt
    `execution` pro Eintrag aus. `release` deckt den kuratierten Ausschnitt für
    Release-Bereitschaft ab; `all` wählt jede aktive Reifekategorie aus und ist für
    explizite Workflow-Dispatches von QA Profile Evidence vorgesehen, wenn ein
    vollständiges Scorecard-Artefakt benötigt wird.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität 4
    (begrenzt durch die Anzahl der ausgewählten Szenarien). Verwenden Sie
    `--concurrency <count>`, um die Worker-Anzahl anzupassen, oder `--concurrency 1`
    für den älteren seriellen Prüfpfad.
  - Beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie
    `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne den szenariobewussten
    `mock-openai`-Prüfpfad zu ersetzen.
- `pnpm openclaw qa coverage --match <query>`
  - Durchsucht Szenario-IDs, Titel, Oberflächen, Abdeckungs-IDs, Doku-Referenzen,
    Code-Referenzen, Plugins und Provider-Anforderungen und gibt dann passende
    Suite-Ziele aus.
  - Verwenden Sie dies vor einem QA Lab-Lauf, wenn Sie das betroffene Verhalten oder
    den Dateipfad kennen, aber nicht das kleinste Szenario. Es ist nur beratend;
    wählen Sie dennoch Mock-, Live-, Multipass-, Matrix- oder Transport-Nachweis
    anhand des geänderten Verhaltens.
- `pnpm test:plugins:kitchen-sink-live`
  - Führt den Live-OpenAI-Kitchen-Sink-Plugin-Parcours über QA Lab aus. Es
    installiert das externe Kitchen-Sink-Paket, verifiziert das Inventar der
    Plugin-SDK-Oberfläche, prüft `/healthz` und `/readyz`, zeichnet Gateway-CPU/RSS-
    Nachweise auf, führt einen Live-OpenAI-Turn aus und prüft adversarielle Diagnostik.
    Erfordert Live-OpenAI-Authentifizierung wie `OPENAI_API_KEY`. In hydrierten
    Testbox-Sitzungen bezieht es automatisch das Testbox-Live-Auth-Profil, wenn der
    Helper `openclaw-testbox-env` vorhanden ist.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Startup-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte
    CPU-Beobachtungszusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltend hohe CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startup-Spitzen als Metriken erfasst
    werden, ohne wie die minutenlange Gateway-Peg-Regression auszusehen.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der
    Checkout noch keine frische Runtime-Ausgabe hat.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast
    praktikabel sind: umgebungsbasierte Provider-Schlüssel, den Pfad zur
    QA-Live-Provider-Konfiguration und `CODEX_HOME`, wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über den
    gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht plus Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatororientierte QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt nicht-interaktives OpenAI-API-Key-Onboarding aus, konfiguriert
    standardmäßig Telegram, verifiziert, dass die paketierte Plugin-Runtime ohne
    Startup-Abhängigkeitsreparatur lädt, führt doctor aus und führt einen lokalen
    Agent-Turn gegen einen gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um denselben
    Paketinstallations-Prüfpfad mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Docker-Smoke der gebauten App für eingebettete
    Runtime-Kontext-Transkripte aus. Es verifiziert, dass verborgener OpenClaw-
    Runtime-Kontext als nicht angezeigte benutzerdefinierte Nachricht persistiert
    wird, statt in den sichtbaren User-Turn zu gelangen, legt dann eine betroffene
    defekte Sitzungs-JSONL an und verifiziert, dass `openclaw doctor --fix` sie mit
    Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Onboarding für das
    installierte Paket aus, konfiguriert Telegram über die installierte CLI und
    verwendet dann den Live-Telegram-QA-Prüfpfad erneut mit diesem installierten
    Paket als SUT-Gateway.
  - Der Wrapper mountet nur die `qa-lab`-Harness-Quelle aus dem Checkout; das
    installierte Paket besitzt `dist`, `openclaw/plugin-sdk` und die gebündelte
    Plugin-Runtime, sodass der Prüfpfad keine Plugins aus dem aktuellen Checkout in
    das zu testende Paket mischt.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen ein aufgelöstes lokales Tarball
    zu testen, statt aus der Registry zu installieren.
  - Gibt standardmäßig wiederholtes RTT-Timing in `qa-evidence.json` mit
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` aus. Überschreiben Sie
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um den RTT-Lauf anzupassen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` akzeptiert eine kommagetrennte Liste von
    Telegram-QA-Prüf-IDs für Stichproben; wenn nicht gesetzt, ist die standardmäßige
    RTT-fähige Prüfung `telegram-mentioned-message-reply`.
  - Verwendet dieselben Telegram-Env-Anmeldedaten oder dieselbe Convex-
    Anmeldedatenquelle wie `pnpm openclaw qa telegram`. Setzen Sie für
    CI-/Release-Automatisierung `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`
    plus `OPENCLAW_QA_CONVEX_SITE_URL` und ein Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper automatisch Convex aus.
  - Der Wrapper validiert Telegram- oder Convex-Anmeldedaten-Env auf dem Host vor
    Docker-Build-/Installationsarbeit. Setzen Sie `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    nur, wenn Sie die Einrichtung vor Anmeldedaten bewusst debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diesen Prüfpfad. Wenn Convex-
    Anmeldedaten ausgewählt sind und keine Rolle gesetzt ist, verwendet der Wrapper
    `ci` in CI und `maintainer` außerhalb von CI.
  - GitHub Actions stellt diesen Prüfpfad als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er läuft nicht bei Merge. Der Workflow verwendet
    die Umgebung `qa-live-shared` und Convex-CI-Anmeldedaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für seitlich ausgeführten
  Produktnachweis gegen ein Kandidatenpaket bereit. Es akzeptiert eine
  vertrauenswürdige Ref, eine veröffentlichte npm-Spezifikation, eine HTTPS-Tarball-
  URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Lauf, lädt das
  normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt dann
  den bestehenden Docker-E2E-Scheduler mit Smoke-, Package-, Product-, Full- oder
  Custom-Prüfpfadprofilen aus. Setzen Sie `telegram_mode=mock-openai` oder
  `live-frontier`, um den Telegram-QA-Workflow gegen dasselbe
  `package-under-test`-Artefakt auszuführen.
  - Aktuellster Beta-Produktnachweis:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Nachweis mit exakter Tarball-URL erfordert einen Digest und verwendet die
  Sicherheitsrichtlinie für öffentliche URLs:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise-/private Tarball-Spiegel verwenden eine explizite Richtlinie für
  vertrauenswürdige Quellen:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` liest `.github/package-trusted-sources.json` aus der
vertrauenswürdigen Workflow-Ref und akzeptiert keine URL-Anmeldedaten oder keinen
Workflow-Eingabe-Bypass für private Netzwerke. Wenn die benannte Richtlinie
Bearer-Auth deklariert, konfigurieren Sie das feste Secret
`OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

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
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Channels/Plugins über
    Konfigurationsänderungen.
  - Verifiziert, dass die Setup-Erkennung unkonfigurierte herunterladbare Plugins
    abwesend lässt, die erste konfigurierte doctor-Reparatur jedes fehlende
    herunterladbare Plugin explizit installiert und ein zweiter Neustart keine
    verborgene Abhängigkeitsreparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor
    dem Ausführen von `openclaw update --tag <candidate>` und verifiziert, dass der
    post-update doctor des Kandidaten Legacy-Plugin-Abhängigkeitsreste ohne
    harnessseitige Postinstall-Reparatur bereinigt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Paketinstallations-Update-Smoke über Parallels-Gäste aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt
    dann im selben Gast den installierten Befehl `openclaw update` aus und verifiziert
    die installierte Version, den Update-Status, Gateway-Bereitschaft und einen
    lokalen Agent-Turn.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`,
    während Sie an einem Gast iterieren. Verwenden Sie `--json` für den Pfad des
    Zusammenfassungsartefakts und den Status pro Prüfpfad.
  - Der OpenAI-Prüfpfad verwendet standardmäßig `openai/gpt-5.5` für den Live-
    Agent-Turn-Nachweis. Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes OpenAI-Modell
    validieren.
  - Umhüllen Sie lange lokale Läufe mit einem Host-Timeout, damit Parallels-
    Transport-Stockungen nicht den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Prüfpfad-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten mit post-update
    doctor und Paketupdate-Arbeit verbringen; das ist weiterhin gesund, wenn das
    verschachtelte npm-Debug-Log voranschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel mit einzelnen Parallels-
    macOS-, Windows- oder Linux-Smoke-Prüfpfaden aus. Sie teilen VM-Zustand und
    können bei Snapshot-Wiederherstellung, Paketbereitstellung oder Gateway-Zustand
    des Gasts kollidieren.
  - Der post-update-Nachweis führt die normale gebündelte Plugin-Oberfläche aus, weil
    Capability-Fassaden wie Sprache, Bildgenerierung und Medienverständnis über
    gebündelte Runtime-APIs geladen werden, selbst wenn der Agent-Turn selbst nur
    eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout - paketierte Installationen liefern `qa-lab` nicht mit.
  - Vollständige CLI, Profil-/Szenariokatalog, Umgebungsvariablen und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus und verwendet dabei die Bot-Token für Treiber und SUT aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwenden Sie standardmäßig den Umgebungsmodus, oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu nutzen.
  - Die Standardwerte decken Canary, Mention-Gating, Befehlsadressierung, `/status`, erwähnte Bot-zu-Bot-Antworten und native Kernbefehlsantworten ab. Die `mock-openai`-Standardwerte decken außerdem deterministische Reply-Chain- und Telegram-Final-Message-Streaming-Regressionen ab. Verwenden Sie `--list-scenarios` für optionale Probes wie `session_status`.
  - Beendet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Aktivieren Sie für stabile Bot-zu-Bot-Beobachtung den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Treiber-Bot Gruppen-Bot-Traffic beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und `qa-evidence.json` unter `.artifacts/qa-e2e/...`. Antwortende Szenarien enthalten RTT von der Sendeanforderung des Treibers bis zur beobachteten SUT-Antwort.

`Mantis Telegram Live` ist der PR-Evidenz-Wrapper um diese Lane. Er führt die
Kandidaten-Referenz mit per Convex geleasten Telegram-Anmeldedaten aus, rendert das redigierte QA-
Berichts-/Evidenz-Bundle in einem Crabbox-Desktop-Browser, zeichnet MP4-Evidenz auf,
erzeugt ein bewegungsgetrimmtes GIF, lädt das Artefakt-Bundle hoch und postet Inline-PR-
Evidenz über die Mantis GitHub App, wenn `pr_number` gesetzt ist. Maintainer können
ihn über die Actions-UI per `Mantis Scenario` (`scenario_id:
telegram-live`) oder direkt aus einem Pull-Request-Kommentar starten:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` ist der agentische native Telegram-Desktop-
Vorher-/Nachher-Wrapper für visuelle PR-Nachweise. Starten Sie ihn über die Actions-UI mit
frei formulierten `instructions`, über `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) oder aus einem PR-Kommentar:

```text
@openclaw-mantis telegram desktop proof
```

Der Mantis-Agent liest den PR, entscheidet, welches Telegram-sichtbare Verhalten die
Änderung belegt, führt die echte Benutzer-Crabbox-Telegram-Desktop-Proof-Lane auf Baseline- und
Kandidaten-Referenzen aus, iteriert, bis die nativen GIFs brauchbar sind, schreibt ein gepaartes
`motionPreview`-Manifest und postet dieselbe zweispaltige GIF-Tabelle über die
Mantis GitHub App, wenn `pr_number` gesetzt ist.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Least oder verwendet einen Crabbox-Linux-Desktop erneut, installiert native Telegram Desktop, konfiguriert OpenClaw mit einem geleasten Telegram-SUT-Bot-Token, startet das Gateway und zeichnet Screenshot-/MP4-Evidenz vom sichtbaren VNC-Desktop auf.
  - Standardmäßig wird `--credential-source convex` verwendet, sodass Workflows nur das Convex-Broker-Secret benötigen. Verwenden Sie `--credential-source env` mit denselben `OPENCLAW_QA_TELEGRAM_*`-Variablen wie bei `pnpm openclaw qa telegram`.
  - Telegram Desktop benötigt weiterhin einen Benutzer-Login/ein Profil. Das Bot-Token konfiguriert nur OpenClaw. Verwenden Sie `--telegram-profile-archive-env <name>` für ein base64-kodiertes `.tgz`-Profilarchiv, oder verwenden Sie `--keep-lease` und melden Sie sich einmal manuell über VNC an.
  - Schreibt `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` und `telegram-desktop-builder.mp4` in das Ausgabeverzeichnis.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht abweichen; die Coverage-Matrix pro Lane befindet sich in [QA-Übersicht → Live-Transport-Coverage](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und ist nicht Teil dieser Matrix.

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
Live-Transport-QA aktiviert ist, erwirbt QA Lab eine exklusive Lease aus einem Convex-gestützten Pool, sendet Heartbeats für diese
Lease, während die Lane läuft, und gibt die Lease beim Herunterfahren frei. Der Abschnittsname stammt aus der Zeit vor
Discord-, Slack- und WhatsApp-Unterstützung; der Lease-Vertrag wird über alle Arten hinweg gemeinsam genutzt.

Referenz-Scaffold für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Umgebungsstandard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs für ausschließlich lokale Entwicklung.

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

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets,
Endpoint-Präfix, HTTP-Timeout und Admin-/Listen-Erreichbarkeit zu prüfen, ohne
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
- `kind: "telegram-user"` ist für den Mantis-Telegram-Desktop-Proof-Workflow reserviert. Generische QA-Lab-Lanes dürfen ihn nicht erwerben.

Vom Broker validierte Multi-Channel-Payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-Lanes können ebenfalls aus dem Pool leasen, aber die Slack-Payload-Validierung
lebt derzeit im Slack-QA-Runner statt im Broker. Verwenden Sie
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
für Slack-Zeilen.

### Einen Channel zu QA hinzufügen

Die Architektur- und Szenario-Helfernamen für neue Channel-Adapter befinden sich in [QA-Übersicht → Einen Channel hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Die Mindestanforderung: den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam implementieren, `qaRunners` im Plugin-Manifest deklarieren, als `openclaw qa <runner>` einhängen und Szenarien unter `qa/scenarios/` verfassen.

## Testsuiten (was wo ausgeführt wird)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden das `vitest.full-*.config.ts`-Shard-Set und können Multi-Projekt-Shards für parallele Planung in projektbezogene Konfigurationen erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten `unit-ui`-Shard
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites `api.js`- und
    `runtime-api.js`-Fallback-Verhalten mit generierten kleinen Plugin-Fixtures beweisen, nicht mit
    echten APIs aus gebündeltem Plugin-Quellcode. Echte Plugin-API-Ladevorgänge gehören in
    Plugin-eigene Vertrags-/Integrationssuiten.

Richtlinie für native Abhängigkeiten:

- Standard-Testinstallationen überspringen optionale native Discord-opus-Builds. Discord Voice verwendet das gebündelte `libopus-wasm`, und `@discordjs/opus` bleibt in `allowBuilds` deaktiviert, damit lokale Tests und Testbox-Lanes das native Add-on nicht kompilieren.
- Vergleichen Sie die native opus-Performance im `libopus-wasm`-Benchmark-Repo, nicht in den Standard-OpenClaw-Installations-/Testschleifen. Setzen Sie `@discordjs/opus` im Standard-`allowBuilds` nicht auf `true`; dadurch würden nicht zusammenhängende Installations-/Testschleifen nativen Code kompilieren.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Nicht zielgerichtete `pnpm test`-Läufe verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Projekt-Prozesses. Das senkt den Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Extension-Arbeit unabhängige Suites ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` routen explizite Datei-/Verzeichnisziele zuerst durch scoped Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollständige Root-Projekt-Startlast bezahlt.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu günstigen scoped Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Source-Mappings und lokale Import-Graph-Abhängige. Config-/Setup-/Package-Änderungen führen keine breiten Testläufe aus, außer Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Check-Gate für schmale Arbeiten. Es klassifiziert den Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; rufen Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise auf. Versions-Bumps nur für Release-Metadaten führen gezielte Versions-/Config-/Root-Dependency-Checks aus, mit einem Guard, der Package-Änderungen außerhalb des Top-Level-Versionsfelds ablehnt.
    - Live-Docker-ACP-Harness-Änderungen führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Live-Docker-Scheduler-Dry-Run. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Dependency-, Export-, Versions- und andere Package-Oberflächenänderungen verwenden weiterhin die breiteren Guards.
    - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helpers, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Helper-Quelldateien mappen Changed-Mode-Läufe ebenfalls auf explizite benachbarte Tests in diesen leichten Lanes, sodass Helper-Änderungen nicht die vollständige schwere Suite für dieses Verzeichnis erneut ausführen.
    - `auto-reply` hat dedizierte Buckets für Top-Level-Core-Helpers, Top-Level-`reply.*`-Integrationstests und den `src/auto-reply/reply/**`-Teilbaum. CI teilt den Reply-Teilbaum zusätzlich in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards auf, damit ein import-lastiger Bucket nicht den gesamten Node-Nachlauf besitzt.
    - Normale PR-/Main-CI überspringt bewusst den Extension-Batch-Sweep und den release-only `agentic-plugins`-Shard. Full Release Validation dispatcht den separaten `Plugin Prerelease`-Child-Workflow für diese Plugin-/Extension-lastigen Suites auf Release-Kandidaten.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Message-Tool-Discovery-Eingaben oder Compaction-Runtime-Kontext
      ändern, behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Helper-Regressionen für reine Routing- und
      Normalisierungsgrenzen hinzu.
    - Halten Sie die Integrations-Suites des eingebetteten Runners gesund:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` und
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass scoped IDs und Compaction-Verhalten weiterhin
      durch die echten `run.ts`- / `compact.ts`-Pfade fließen; reine Helper-Tests
      sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool- und Isolations-Defaults">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsam genutzte Vitest-Konfiguration setzt `isolate: false` fest und verwendet den
      nicht isolierten Runner über die Root-Projekte, E2E- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft aber ebenfalls auf dem
      gemeinsam genutzten nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben `threads`- + `isolate: false`-
      Defaults aus der gemeinsam genutzten Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Vitest-Child-Node-
      Prozesse hinzu, um V8-Compile-Churn bei großen lokalen Läufen zu reduzieren.
      Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standard-V8-
      Verhalten zu vergleichen.
    - `scripts/run-vitest.mjs` beendet explizite Nicht-Watch-Vitest-Läufe nach
      5 Minuten ohne stdout- oder stderr-Ausgabe. Setzen Sie
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, um den Watchdog für eine
      absichtlich stille Untersuchung zu deaktivieren.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook führt nur Formatierung aus. Er staged formatierte Dateien erneut und
      führt kein Linting, keinen Typecheck und keine Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor der Übergabe oder vor dem Push aus, wenn Sie
      das intelligente lokale Check-Gate benötigen.
    - `pnpm test:changed` routet standardmäßig durch günstige scoped Lanes. Verwenden Sie
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent
      entscheidet, dass eine Harness-, Config-, Package- oder Contract-Änderung wirklich breitere
      Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
      Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Lokales Worker-Autoscaling ist bewusst konservativ und fährt zurück,
      wenn der Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige
      Vitest-Läufe standardmäßig weniger Schaden verursachen.
    - Die Basis-Vitest-Konfiguration markiert die Projects-/Config-Dateien als
      `forceRerunTriggers`, damit Changed-Mode-Reruns korrekt bleiben, wenn sich die Test-
      Verdrahtung ändert.
    - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
      Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
      einen expliziten Cache-Speicherort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Perf-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Import-Dauerberichte plus
      Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` scoped dieselbe Profiling-Ansicht auf
      Dateien, die seit `origin/main` geändert wurden.
    - Shard-Timing-Daten werden nach `.artifacts/vitest-shard-timings.json` geschrieben.
      Whole-Config-Läufe verwenden den Config-Pfad als Schlüssel; Include-Pattern-CI-
      Shards hängen den Shard-Namen an, damit gefilterte Shards separat nachverfolgt
      werden können.
    - Wenn ein heißer Test weiterhin den Großteil seiner Zeit in Startup-Imports verbringt,
      halten Sie schwere Dependencies hinter einer schmalen lokalen `*.runtime.ts`-Naht und
      mocken Sie diese Naht direkt, statt Runtime-Helpers per Deep-Import nur
      durch `vi.mock(...)` durchzureichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
      `test:changed` mit dem nativen Root-Projekt-Pfad für diesen committeten
      Diff und gibt Wall Time plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen
      Dirty Tree, indem die geänderte Dateiliste durch
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für
      Vitest-/Vite-Startup und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU-+Heap-Profile für die
      Unit-Suite mit deaktivierter Datei-Parallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet standardmäßig einen echten loopback Gateway mit aktivierter Diagnose
  - Treibt synthetischen Gateway-Message-, Memory- und Large-Payload-Churn durch den Diagnose-Event-Pfad
  - Fragt `diagnostics.stability` über den Gateway-WS-RPC ab
  - Deckt Persistenz-Helpers für Diagnose-Stabilitäts-Bundles ab
  - Assertet, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Pressure-Budget bleiben und Queue-Tiefen pro Sitzung wieder auf null ablaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Schmale Lane für Stabilitätsregressions-Follow-up, kein Ersatz für die vollständige Gateway-Suite

### E2E (Repo-Aggregat)

- Befehl: `pnpm test:e2e`
- Umfang:
  - Führt die Gateway-Smoke-E2E-Lane aus
  - Führt die gemockte Control-UI-Browser-E2E-Lane aus
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Erfordert installiertes Playwright Chromium

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e:gateway`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und gebündelte Plugin-E2E-Tests unter `extensions/`
- Runtime-Defaults:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Console-Ausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Multi-Instance-Gateways
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwerere Netzwerkarbeit
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E (gemockter Control-UI-Browser)

- Befehl: `pnpm test:ui:e2e`
- Konfiguration: `test/vitest/vitest.ui-e2e.config.ts`
- Dateien: `ui/src/**/*.e2e.test.ts`
- Umfang:
  - Startet die Vite-Control-UI
  - Steuert eine echte Chromium-Seite über Playwright
  - Ersetzt den Gateway-WebSocket durch deterministische In-Browser-Mocks
- Erwartungen:
  - Läuft in CI als Teil von `pnpm test:e2e`
  - Kein echter Gateway, keine Agents und keine Provider-Schlüssel erforderlich
  - Browser-Dependency muss vorhanden sein (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Verwendet einen aktiven lokalen OpenShell-Gateway wieder
  - Erstellt eine Sandbox aus einer temporären lokalen Dockerfile
  - Übt OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Exec aus
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Erfordert einen aktiven lokalen OpenShell-Gateway und dessen Config-Quelle
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend die Test-Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, um die registrierte Gateway-Config für den isolierten Test verfügbar zu machen
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, um die Docker-Gateway-IP zu überschreiben, die vom Host-Policy-Fixture verwendet wird

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests für gebündelte Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Änderungen am Provider-Format, Besonderheiten beim Tool-Aufruf, Auth-Probleme und Verhalten bei Rate Limits
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / nutzt Rate Limits
  - Bevorzugen Sie eingegrenzte Teilmengen statt „alles“
- Live-Läufe verwenden bereits exportierte API-Schlüssel und bereitgestellte Auth-Profile.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests bewusst Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet standardmäßig einen ruhigeren Modus: Die Fortschrittsausgabe `[live] ...` bleibt erhalten, während Gateway-Bootstrap-Logs/Bonjour-Rauschen stummgeschaltet werden. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startprotokolle wieder sehen möchten.
- API-Schlüssel-Rotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Live-spezifische Überschreibung über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen auf stderr aus, damit lange Provider-Aufrufe sichtbar aktiv bleiben, selbst wenn die Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, damit Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite soll ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Pairing anfassen: Ergänzen Sie `pnpm test:e2e`
- „Mein Bot ist ausgefallen“ debuggen / Provider-spezifische Fehler / Tool-Aufrufe: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smoke-Tests, ACP-Smoke-Tests, den Codex-App-Server-
Harness und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) sowie den Umgang mit Zugangsdaten für Live-Läufe siehe
[Live-Suites testen](/de/help/testing-live). Für die dedizierte Checkliste für Updates und
Plugin-Validierung siehe
[Updates und Plugins testen](/de/help/testing-updates-plugins).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen auf:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweils passende Profile-Key-Live-Datei innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`) und mounten Ihr lokales Konfigurationsverzeichnis, den Arbeitsbereich und optional eine Profil-Env-Datei. Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner behalten bei Bedarf ihre eigenen praktischen Obergrenzen:
  `test:docker:live-models` verwendet standardmäßig die kuratierte unterstützte High-Signal-Auswahl, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Setzen Sie `OPENCLAW_LIVE_MAX_MODELS`
  oder die Gateway-Env-Variablen, wenn Sie ausdrücklich eine kleinere Obergrenze oder einen größeren Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut/verwendet dann zwei `scripts/e2e/Dockerfile`-Images. Das Bare-Image ist nur der Node-/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorgebauten Tarball. Das Functional-Image installiert denselben Tarball nach `/app` für Lanes mit Built-App-Funktionalität. Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenlimits verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer als die aktiven Limits ist, kann der Scheduler sie trotzdem starten, wenn der Pool leer ist, und lässt sie dann allein laufen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig einen Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aus, speichert erfolgreiche Lane-Laufzeiten in `.artifacts/docker-tests/lane-timings.json` und nutzt diese Zeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Build oder Docker-Ausführung auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“. Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt die ausgewählte Ref neu zu packen. Profile sind nach Breite geordnet: `smoke`, `package`, `product` und `full`. Siehe [Updates und Plugins testen](/de/help/testing-updates-plugins) für den Paket-/Update-/Plugin-Vertrag, die Survivor-Matrix für veröffentlichte Upgrades, Release-Standards und Fehlertriage.
- Build- und Release-Prüfungen führen nach tsdown `scripts/check-cli-bootstrap-imports.mjs` aus. Der Guard durchläuft den statisch gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn der Start vor dem Dispatch Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor dem Command-Dispatch importiert; außerdem hält er den gebündelten Gateway-Run-Chunk unter dem Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Der Packaged-CLI-Smoke-Test deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Model-List-Befehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert der Harness nur Metadatenlücken ausgelieferter Pakete: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Install-Records, fehlende Persistenz von Marketplace-Install-Records und Migration von Konfigurationsmetadaten während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren übergeordnete Integrationspfade.
- Docker-/Bash-E2E-Lanes, die den gepackten OpenClaw-Tarball über `scripts/lib/openclaw-e2e-instance.sh` installieren, begrenzen `npm install` auf `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (Standard `600s`; setzen Sie `0`, um den Wrapper zum Debuggen zu deaktivieren).

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit externe CLI-OAuth Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direct Models: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid-/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Tests: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` und `pnpm qa:observability:smoke` sind private QA-Lanes für Source-Checkouts. Sie sind bewusst nicht Teil der Paket-Docker-Release-Lanes, da der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Channel-/Agent-Smoke-Test: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI über Env-Ref-Onboarding sowie standardmäßig Telegram, führt Doctor aus und führt einen gemockten OpenAI-Agent-Turn aus. Verwenden Sie einen vorgebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oder wechseln Sie den Channel mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` oder `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Release-Smoke-Test für die Nutzerreise: `pnpm test:docker:release-user-journey` installiert das gepackte OpenClaw-Tarball global in einem sauberen Docker-Home, führt das Onboarding aus, konfiguriert einen simulierten OpenAI-Provider, führt einen Agent-Durchlauf aus, installiert/deinstalliert externe Plugins, konfiguriert ClickClack gegen ein lokales Fixture, verifiziert ausgehende/eingehende Nachrichten, startet Gateway neu und führt doctor aus.
- Release-Smoke-Test für typisiertes Onboarding: `pnpm test:docker:release-typed-onboarding` installiert das gepackte Tarball, steuert `openclaw onboard` über ein echtes TTY, konfiguriert OpenAI als Provider mit Umgebungsreferenz, verifiziert, dass kein roher Schlüssel persistiert wird, und führt einen simulierten Agent-Durchlauf aus.
- Release-Smoke-Test für Medien/Speicher: `pnpm test:docker:release-media-memory` installiert das gepackte Tarball, verifiziert Bildverständnis aus einem PNG-Anhang, OpenAI-kompatible Ausgabe zur Bilderzeugung, Abruf über Speichersuche und das Überleben des Abrufs nach einem Gateway-Neustart.
- Release-Smoke-Test für Upgrade-Nutzerreise: `pnpm test:docker:release-upgrade-user-journey` installiert standardmäßig die neueste veröffentlichte Baseline, die älter als das Kandidaten-Tarball ist, konfiguriert Provider-/Plugin-/ClickClack-Zustand im veröffentlichten Paket, aktualisiert auf das Kandidaten-Tarball und führt anschließend die zentrale Agent-/Plugin-/Kanal-Nutzerreise erneut aus. Wenn keine ältere veröffentlichte Baseline vorhanden ist, wird die Kandidatenversion wiederverwendet. Überschreiben Sie die Baseline mit `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Release-Smoke-Test für Plugin-Marktplatz: `pnpm test:docker:release-plugin-marketplace` installiert aus einem lokalen Fixture-Marktplatz, aktualisiert das installierte Plugin, deinstalliert es und verifiziert, dass die Plugin-CLI verschwindet und Installationsmetadaten bereinigt werden.
- Skills-Installations-Smoke-Test: `pnpm test:docker:skill-install` installiert das gepackte OpenClaw-Tarball global in Docker, deaktiviert hochgeladene Archivinstallationen in der Konfiguration, löst den aktuellen Live-ClawHub-Skill-Slug aus der Suche auf, installiert ihn mit `openclaw skills install` und verifiziert den installierten Skill sowie `.clawhub`-Herkunfts-/Sperrmetadaten.
- Smoke-Test für Update-Kanalwechsel: `pnpm test:docker:update-channel-switch` installiert das gepackte OpenClaw-Tarball global in Docker, wechselt von Paket `stable` zu Git `dev`, verifiziert den persistierten Kanal und die Plugin-Funktion nach dem Update, wechselt anschließend zurück zum Paket `stable` und prüft den Update-Status.
- Smoke-Test für Upgrade-Überlebensfähigkeit: `pnpm test:docker:upgrade-survivor` installiert das gepackte OpenClaw-Tarball über ein schmutziges Fixture eines alten Benutzers mit Agents, Kanalkonfiguration, Plugin-Zulassungslisten, veraltetem Plugin-Abhängigkeitszustand und vorhandenen Workspace-/Sitzungsdateien. Es führt ein Paket-Update plus nicht interaktiven doctor ohne Live-Provider- oder Kanalschlüssel aus, startet anschließend ein Loopback-Gateway und prüft Konfigurations-/Zustandserhalt sowie Budgets für Start und Status.
- Smoke-Test für veröffentlichte Upgrade-Überlebensfähigkeit: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, legt realistische Dateien eines bestehenden Benutzers an, konfiguriert diese Baseline mit einem eingebetteten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf das Kandidaten-Tarball, führt nicht interaktiven doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend ein Loopback-Gateway und prüft konfigurierte Intents, Zustandserhalt, Start, `/healthz`, `/readyz` und RPC-Statusbudgets. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, lassen Sie den aggregierten Scheduler exakte lokale Baselines mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` erweitern und erweitern Sie issue-förmige Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` wie `reported-issues`; die Gruppe `reported-issues` enthält `configured-plugin-installs` für die automatische Reparatur externer OpenClaw-Plugin-Installationen. Die Paketabnahme stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit, löst Meta-Baseline-Tokens wie `last-stable-4` oder `all-since-2026.4.23` auf, und die vollständige Release-Validierung erweitert das Release-Soak-Paket-Gate auf `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke-Test für Sitzungslaufzeitkontext: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz versteckter Laufzeitkontext-Transkripte plus die doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Zweige.
- Smoke-Test für globale Bun-Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängen zu bleiben. Verwenden Sie ein vorab gebautes Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` erneut, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke-Test: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen seinen Root-, Update- und Direct-npm-Containern. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Baseline vor dem Upgrade auf das Kandidaten-Tarball. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Wiederholungen hinweg wiederzuverwenden.
- Install-Smoke-CI überspringt das doppelte globale Direct-npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Umgebungsvariable aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- CLI-Smoke-Test für Agents zum Löschen geteilter Workspaces: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt in einem isolierten Container-Home zwei Agents mit einem Workspace an, führt `agents delete --json` aus und verifiziert gültiges JSON plus Verhalten zum Beibehalten des Workspaces. Verwenden Sie das Install-Smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` wieder.
- Gateway-Netzwerk (zwei Container, WS-Authentifizierung + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-Test für Browser-CDP-Snapshot: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Quell-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, per Cursor hochgestufte anklickbare Elemente, iframe-Refs und Frame-Metadaten abdecken.
- OpenAI-Responses-Regression für web_search mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen simulierten OpenAI-Server über Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` erhöht, erzwingt anschließend eine Ablehnung durch das Provider-Schema und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Kanalbrücke (gesetztes Gateway + stdio-Brücke + roher Claude-Benachrichtigungsframe-Smoke-Test): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter OpenClaw-Profil-Allow-/Deny-Smoke-Test): `pnpm test:docker:agent-bundle-mcp-tools` (Skript: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Bereinigung (echtes Gateway + Abbau des stdio-MCP-Kindprozesses nach isolierten Cron- und einmaligen Subagent-Ausführungen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Installations-/Update-Smoke-Test für lokalen Pfad, `file:`, npm-Registry mit hoisted Abhängigkeiten, fehlerhafte npm-Paketmetadaten, bewegliche Git-Refs, ClawHub-Kitchen-Sink, Marktplatz-Updates und Claude-Bundle-Aktivierung/-Inspektion): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Paket-/Runtime-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Smoke-Test für unverändertes Plugin-Update: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-Test für Plugin-Lifecycle-Matrix: `pnpm test:docker:plugin-lifecycle-matrix` installiert das gepackte OpenClaw-Tarball in einem leeren Container, installiert ein npm-Plugin, schaltet Aktivierung/Deaktivierung um, führt Upgrade und Downgrade über eine lokale npm-Registry aus, löscht den installierten Code und verifiziert anschließend, dass die Deinstallation weiterhin veralteten Zustand entfernt, während RSS-/CPU-Metriken für jede Lifecycle-Phase protokolliert werden.
- Smoke-Test für Konfigurations-Neuladen-Metadaten: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Installations-/Update-Smoke-Tests für lokalen Pfad, `file:`, npm-Registry mit hoisted Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marktplatz-Updates und Claude-Bundle-Aktivierung/-Inspektion ab. `pnpm test:docker:plugin-update` deckt unverändertes Update-Verhalten für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt ressourcenverfolgte npm-Plugin-Installation, Aktivierung, Deaktivierung, Upgrade, Downgrade und Deinstallation bei fehlendem Code ab.

So bauen Sie das geteilte funktionale Image manuell vorab und verwenden es wieder:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes geteiltes Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der geteilten gebauten App-Runtime validieren.

Die Live-Modell-Docker-Runner binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in einem temporären Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihre exakte lokale Quelle/Konfiguration läuft.
Der Bereitstellungsschritt überspringt große, nur lokal verwendete Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram/Discord/usw.-Kanal-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über Open WebUIs `/api/chat/completions`-Proxy.
Setzen Sie `OPENWEBUI_SMOKE_MODE=models` für CI-Prüfungen im Release-Pfad, die nach
Open-WebUI-Anmeldung und Modellerkennung stoppen sollen, ohne auf eine Live-Modell-
Vervollständigung zu warten.
Der erste Lauf kann spürbar langsamer sein, weil Docker möglicherweise das
Open-WebUI-Image ziehen muss und Open WebUI seine eigene Kaltstart-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modell-Schlüssel. Stellen Sie ihn über die Prozess-
Umgebung, bereitgestellte Auth-Profile oder eine explizite `OPENCLAW_PROFILE_FILE` bereit.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorbefüllten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann geroutete Konversationserkennung, Transkript-Lesevorgänge, Anhangsmetadaten,
Live-Ereigniswarteschlangenverhalten, Routing ausgehender Sendungen sowie Claude-artige Kanal- und
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, damit der Smoke validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:agent-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Schlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
innerhalb des Containers, materialisiert diesen Server über die eingebettete OpenClaw-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie filtern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Schlüssel. Es startet ein vorbefülltes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen `sessions_spawn`-Einmal-Child-Turn aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Plain-Language-Thread-Smoke (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es kann erneut für die Validierung des ACP-Thread-Routings benötigt werden; löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` wird gemountet und vor dem Ausführen der Tests geladen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Umgebungsvariablen zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` geladen wurden, mit temporären Konfigurations-/Arbeitsverzeichnis-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` gemountet, für gecachte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für Wiederholungsläufe wiederzuverwenden, die keinen Neubau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profilspeicher kommen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das vom Gateway für den Open-WebUI-Smoke bereitgestellt wird
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den Nonce-Prüf-Prompt zu überschreiben, der vom Open-WebUI-Smoke verwendet wird
- `OPENWEBUI_IMAGE=...`, um das gepinnte Open-WebUI-Image-Tag zu überschreiben

## Docs-Plausibilitätsprüfung

Führen Sie nach Dokumentationsänderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anker-Validierung aus, wenn Sie auch seiteninterne Überschriftenprüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Aufrufe (Mock-OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: „führt einen Mock-OpenAI-Tool-Aufruf Ende-zu-Ende über den Gateway-Agent-Loop aus“)
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + erzwungene Auth): `src/gateway/gateway.test.ts` (Fall: „führt den Assistenten über ws aus und schreibt Auth-Token-Konfiguration“)

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Aufrufe durch das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- Ende-zu-Ende-Assistenten-Flows, die Session-Verkabelung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungslogik:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrstufige Szenarien, die Tool-Reihenfolge, Übernahme der Sitzungsverlaufs und Sandbox-Grenzen absichern.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesevorgänge und Session-Verkabelung abzusichern.
- Eine kleine Suite Skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, umgebungsgesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite von
Form- und Verhaltensassertionen aus. Die standardmäßige `pnpm test`-Unit-Lane überspringt diese gemeinsamen
Nahtstellen- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Kanal- oder Provider-Oberflächen berühren.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Einrichtungsassistenten-Vertrag
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Struktur der Nachrichtennutzlast
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Kanal-Aktionshandler
- **threading** - Verarbeitung von Thread-IDs
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Zu finden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanalstatus-Probes
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Zu finden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Modellkatalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Einrichtungsassistent

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Unterpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactoring von Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein Provider-/Modellproblem beheben, das live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassung der exakten Transformation der Anfrageform)
- Wenn es inhärent nur live prüfbar ist (Ratenlimits, Auth-Richtlinien), halten Sie den Live-Test eng und als Opt-in über Umgebungsvariablen
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Fehler erkennt:
  - Provider-Anfragekonvertierungs-/Replay-Fehler → direkter Modelltest
  - Gateway-Session-/History-/Tool-Pipeline-Fehler → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Leitplanke:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse ein gesampeltes Ziel aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und assertet dann, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Zielfamilie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
- [CI](/de/ci)
