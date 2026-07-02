---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Provider-Fehler hinzufügen
    - Debugging von Gateway- und Agent-Verhalten
summary: 'Test-Kit: Unit-, E2E- und Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-07-02T08:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw hat drei Vitest-Suiten (Unit/Integration, e2e, live) und eine kleine Gruppe
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für typische Workflows ausführen (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten erkennen und Modelle/Provider auswählen.
- Wie Sie Regressionen für reale Modell-/Provider-Probleme hinzufügen.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Überblick](/de/concepts/qa-e2e-automation) - Architektur, Befehlsoberfläche, Szenarioerstellung.
- [Matrix-QA](/de/concepts/qa-matrix) - Referenz für `pnpm openclaw qa matrix`.
- [Reifegrad-Scorecard](/de/maturity/scorecard) - wie Release-QA-Nachweise Stabilitäts- und LTS-Entscheidungen unterstützen.
- [QA-Kanal](/de/channels/qa-channel) - das synthetische Transport-Plugin, das von repo-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Testsuiten und Docker-/Parallels-Runner. Der QA-spezifische Runner-Abschnitt unten ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die oben genannten Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Full-Suite-Lauf auf einer großzügig ausgestatteten Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Datei-Targeting routet jetzt auch Extension-/Kanalpfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit wünschen:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

## Test-Temp-Verzeichnisse

Bevorzugen Sie die gemeinsamen Hilfsfunktionen in `test/helpers/temp-dir.ts` für test-eigene
temporäre Verzeichnisse. Sie machen Besitzverhältnisse explizit und halten die Bereinigung im selben
Test-Lebenszyklus:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` stellt absichtlich keine manuelle Bereinigungsmethode bereit; Vitest
übernimmt die Bereinigung nach jedem Test. Vorhandene Low-Level-Hilfsfunktionen bleiben für Tests bestehen, die
noch nicht migriert wurden, aber neue und migrierte Tests sollten den automatisch bereinigenden
Tracker verwenden. Vermeiden Sie neue manuelle Verwendungen von `makeTempDir`, `cleanupTempDirs` oder
`createTempDirTracker` sowie neue direkte `fs.mkdtemp*`-Aufrufe in Tests,
außer ein Fall verifiziert ausdrücklich rohes Temp-Dir-Verhalten. Fügen Sie einen prüfbaren
Allow-Kommentar mit einem konkreten Grund hinzu, wenn ein Test absichtlich ein direktes temporäres
Verzeichnis benötigt:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Für Migrationssichtbarkeit meldet `node scripts/report-test-temp-creations.mjs`
neue direkte Temp-Dir-Erstellungen und neue manuelle Nutzung gemeinsamer Hilfsfunktionen in hinzugefügten Diff-
Zeilen, ohne bestehende Bereinigungsstile zu blockieren. Sein Dateiscope folgt absichtlich
derselben Testpfad-Klassifizierung, die `scripts/changed-lanes.mjs` verwendet,
statt eine separate Dateinamen-Heuristik für Test-Hilfsfunktionen zu pflegen, während
die Implementierung der gemeinsamen Hilfsfunktion selbst übersprungen wird. `check:changed` führt diesen Bericht für
geänderte Testpfade als reines Warnsignal in CI aus; Befunde sind GitHub-Warn-
Annotationen, keine Fehler.

Beim Debuggen echter Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine Live-Datei leise gezielt ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime-Performance-Berichte: starten Sie `OpenClaw Performance` mit
  `live_openai_candidate=true` für einen echten Agent-Turn mit `openai/gpt-5.5` oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Tägliche geplante Läufe
  veröffentlichen Mock-Provider-, Deep-Profile- und GPT-5.5-Lane-Artefakte nach
  `openclaw/clawgrit-reports`, wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist. Der
  Mock-Provider-Bericht enthält außerdem Zahlen zu Gateway-Start auf Source-Ebene, Speicher,
  Plugin-Druck, wiederholter Fake-Model-Hello-Schleife und CLI-Start.
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Probe im Stil eines Dateilesens aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen winzigen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: tägliche `OpenClaw Scheduled Live And E2E Checks` und manuelle
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, was separate Docker-Live-Modell-
    Matrix-Jobs einschließt, die nach Provider geshardet sind.
  - Für fokussierte CI-Wiederholungsläufe starten Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue Provider-Secrets mit hohem Signalwert zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Callern hinzu.
- Nativer Codex-Bound-Chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert anschließend eine einfache Antwort und eine Bildanhang-
    Route durch die native Plugin-Bindung statt ACP.
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns durch das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Probes aus. Deaktivieren Sie die Sub-Agent-Probe mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet nach der Sub-Agent-Probe, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht gesetzt ist.
- Codex-On-Demand-Install-Smoke: `pnpm test:docker:codex-on-demand`
  - Installiert das paketierte OpenClaw-Tarball in Docker, führt das OpenAI-API-Key-
    Onboarding aus und verifiziert, dass das Codex-Plugin plus die `@openai/codex`-Abhängigkeit
    bei Bedarf in den verwalteten npm-Projekt-Root heruntergeladen wurden.
- Live-Plugin-Tool-Abhängigkeits-Smoke: `pnpm test:docker:live-plugin-tool`
  - Paketiert ein Fixture-Plugin mit einer echten `slugify`-Abhängigkeit, installiert es über
    `npm-pack:`, verifiziert die Abhängigkeit unter dem verwalteten npm-Projekt-Root
    und fordert dann ein Live-OpenAI-Modell auf, das Plugin-Tool aufzurufen und den versteckten
    Slug zurückzugeben.
- Crestodian-Rettungsbefehl-Smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit zusätzlicher Absicherung für die Rettungsbefehlsoberfläche des Nachrichtenkanals.
    Sie übt `/crestodian status` aus, stellt eine persistente Modelländerung in die Warteschlange,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Config-Schreibpfad.
- Crestodian-Planner-Docker-Smoke: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem configlosen Container mit einer gefälschten Claude-CLI auf `PATH`
    aus und verifiziert, dass der Fuzzy-Planner-Fallback in einen auditierten typisierten
    Config-Schreibvorgang übersetzt wird.
- Crestodian-First-Run-Docker-Smoke: `pnpm test:docker:crestodian-first-run`
  - Startet mit einem leeren OpenClaw-State-Dir, verifiziert den modernen Onboard-
    Crestodian-Einstiegspunkt, wendet Setup-/Modell-/Agent-/Discord-Plugin- und SecretRef-
    Schreibvorgänge an, validiert die Config und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-
    Pfad wird auch in QA Lab durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` abgedeckt.
- Moonshot/Kimi-Kosten-Smoke: mit gesetztem `MOONSHOT_API_KEY` führen Sie
  `openclaw models list --provider moonshot --json` aus, dann einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisiertes `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlschlagenden Fall benötigen, grenzen Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen ein.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttestsuiten, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. Agentic-Parität ist unter
`QA-Lab - All Lanes` und Release-Validierung verschachtelt, kein eigenständiger PR-Workflow.
Breite Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Checks verwenden. Stabile/standardmäßige Release-
Checks halten ausführlichen Live-/Docker-Soak hinter `run_release_soak=true`; das
`full`-Profil erzwingt Soak. `QA-Lab - All Lanes`
läuft nächtlich auf `main` und per manueller Auslösung mit der Mock-Parity-Lane, der Live-
Matrix-Lane, der Convex-verwalteten Live-Telegram-Lane und der Convex-verwalteten Live-Discord-
Lane als parallele Jobs. Geplante QA- und Release-Checks übergeben Matrix
explizit `--profile fast`, während die Matrix-CLI und die manuelle Workflow-Eingabe
standardmäßig `all` bleiben; manuelle Auslösung kann `all` in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`-Jobs sharden. `OpenClaw Release
Checks` führt vor der Release-Freigabe Parität plus die schnellen Matrix- und Telegram-Lanes aus
und verwendet `mock-openai/gpt-5.5` für Release-Transportprüfungen, damit sie
deterministisch bleiben und den normalen Provider-Plugin-Start vermeiden. Diese Live-Transport-
Gateways deaktivieren Memory-Suche; Memory-Verhalten bleibt durch die QA-Parity-
Suiten abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
`ghcr.io/openclaw/openclaw-live-test:<sha>`-Image, das einmal pro ausgewähltem
Commit gebaut wird, und ziehen es dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, statt es
in jedem Shard neu zu bauen.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Schreibt Artefakte der obersten Ebene `qa-evidence.json`, `qa-suite-summary.json` und
    `qa-suite-report.md` für den ausgewählten Szenariosatz, einschließlich
    gemischter Flow-, Vitest- und Playwright-Szenarioauswahlen.
  - Wenn durch `pnpm openclaw qa run --qa-profile <profile>` ausgelöst, bettet es die
    Scorecard des ausgewählten Taxonomieprofils in dieselbe `qa-evidence.json` ein.
    `smoke-ci` schreibt schlanke Evidenz, setzt dadurch `evidenceMode: "slim"` und lässt
    pro Eintrag `execution` aus. `release` deckt den kuratierten Ausschnitt für Release-Bereitschaft ab;
    `all` wählt jede aktive Reifekategorie aus und ist für explizite QA
    Profile Evidence-Workflow-Auslösungen gedacht, wenn ein vollständiges Scorecard-Artefakt
    benötigt wird.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Worker-
    Anzahl anzupassen, oder `--concurrency 1` für den älteren seriellen Lane.
  - Beendet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code wünschen.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne den szenariobewussten
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa coverage --match <query>`
  - Durchsucht Szenario-IDs, Titel, Oberflächen, Coverage-IDs, Docs-Refs, Code-Refs,
    Plugins und Provider-Anforderungen und gibt dann passende Suite-Ziele aus.
  - Verwenden Sie dies vor einem QA Lab-Lauf, wenn Ihnen das betroffene Verhalten oder der Dateipfad
    bekannt ist, aber nicht das kleinste Szenario. Es ist nur beratend; wählen Sie weiterhin Mock-,
    Live-, Multipass-, Matrix- oder Transport-Evidenz anhand des geänderten Verhaltens.
- `pnpm test:plugins:kitchen-sink-live`
  - Führt den Live-OpenAI-Kitchen-Sink-Plugin-Härtetest über QA Lab aus. Er
    installiert das externe Kitchen-Sink-Paket, verifiziert das Inventar der Plugin-SDK-Oberfläche,
    prüft `/healthz` und `/readyz`, zeichnet Gateway-CPU/RSS-
    Evidenz auf, führt einen Live-OpenAI-Turn aus und prüft adversarielle Diagnosen.
    Erfordert Live-OpenAI-Authentifizierung wie `OPENAI_API_KEY`. In hydratisierten Testbox-
    Sitzungen lädt er automatisch das Testbox-Live-Auth-Profil, wenn der
    `openclaw-testbox-env`-Helper vorhanden ist.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Startup-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte CPU-Beobachtungs-
    Zusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltende Hot-CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startup-Spitzen als Metriken aufgezeichnet werden,
    ohne wie die minutenlange Gateway-Peg-Regression auszusehen.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der Checkout noch keine
    frische Runtime-Ausgabe enthält.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    umgebungsbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`,
    wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über den
    gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht plus Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartige QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut einen npm-Tarball aus dem aktuellen Checkout, installiert ihn global in
    Docker, führt nicht-interaktives OpenAI-API-Key-Onboarding aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass die paketierte Plugin-Runtime ohne Startup-
    Dependency-Reparatur lädt, führt doctor aus und führt einen lokalen Agent-Turn gegen einen
    gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um denselben Packaged-Install-
    Lane mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Built-App-Docker-Smoke für eingebettete Runtime-Kontext-
    Transkripte aus. Er verifiziert, dass verborgener OpenClaw-Runtime-Kontext als
    nicht angezeigte benutzerdefinierte Nachricht persistiert wird, anstatt in den sichtbaren User-Turn zu leaken,
    sät dann eine betroffene defekte Sitzungs-JSONL und verifiziert, dass
    `openclaw doctor --fix` sie mit einem Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Onboarding für das installierte Paket aus,
    konfiguriert Telegram über die installierte CLI und verwendet dann den
    Live-Telegram-QA-Lane mit diesem installierten Paket als SUT-Gateway wieder.
  - Der Wrapper mountet nur die `qa-lab`-Harness-Quelle aus dem Checkout; das
    installierte Paket besitzt `dist`, `openclaw/plugin-sdk` und die gebündelte Plugin-
    Runtime, sodass der Lane keine aktuellen Checkout-Plugins in das getestete Paket
    mischt.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen einen aufgelösten lokalen Tarball zu testen,
    statt aus der Registry zu installieren.
  - Gibt standardmäßig wiederholte RTT-Zeitmessung in `qa-evidence.json` mit
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` aus. Überschreiben Sie
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um den RTT-Lauf anzupassen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` akzeptiert eine kommagetrennte Liste von
    Telegram-QA-Check-IDs zum Sampeln; wenn nicht gesetzt, ist der standardmäßige RTT-fähige Check
    `telegram-mentioned-message-reply`.
  - Verwendet dieselben Telegram-Env-Zugangsdaten oder dieselbe Convex-Zugangsdatenquelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automation setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch aus.
  - Der Wrapper validiert die Telegram- oder Convex-Zugangsdaten-Env auf dem Host, bevor
    Docker-Build-/Installationsarbeit beginnt. Setzen Sie `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    nur, wenn Sie absichtlich das Setup vor den Zugangsdaten debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diesen Lane. Wenn Convex-Zugangsdaten
    ausgewählt sind und keine Rolle gesetzt ist, verwendet der Wrapper `ci` in CI und
    `maintainer` außerhalb von CI.
  - GitHub Actions stellt diesen Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er läuft nicht bei Merge. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Zugangsdaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für nebenläufige Produkt-Evidenz
  gegen ein Kandidatenpaket bereit. Es akzeptiert eine vertrauenswürdige Ref, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Lauf, lädt
  die normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt dann den
  bestehenden Docker-E2E-Scheduler mit Smoke-, Package-, Product-, Full- oder Custom-
  Lane-Profilen aus. Setzen Sie `telegram_mode=mock-openai` oder `live-frontier`, um den
  Telegram-QA-Workflow gegen dasselbe `package-under-test`-Artefakt auszuführen.
  - Neueste Beta-Produkt-Evidenz:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Evidenz für eine exakte Tarball-URL erfordert einen Digest und verwendet die Sicherheitsrichtlinie für öffentliche URLs:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise-/private Tarball-Mirrors verwenden eine explizite Trusted-Source-Richtlinie:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` liest `.github/package-trusted-sources.json` aus der vertrauenswürdigen Workflow-Ref und akzeptiert keine URL-Zugangsdaten oder einen Private-Network-Bypass als Workflow-Eingabe. Wenn die benannte Richtlinie Bearer-Auth deklariert, konfigurieren Sie das feste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-Secret.

- Artefakt-Evidenz lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet den Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins über Konfigurations-
    Änderungen.
  - Verifiziert, dass die Setup-Erkennung unkonfigurierte herunterladbare Plugins nicht enthält,
    dass die erste konfigurierte doctor-Reparatur jedes fehlende herunterladbare
    Plugin explizit installiert und dass ein zweiter Neustart keine verborgene Dependency-
    Reparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der Post-Update-doctor des Kandidaten
    Legacy-Plugin-Dependency-Rückstände ohne harnessseitige Postinstall-Reparatur bereinigt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Packaged-Install-Update-Smoke über Parallels-Gäste hinweg aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt dann
    den installierten Befehl `openclaw update` im selben Gast aus und verifiziert die
    installierte Version, den Update-Status, die Gateway-Bereitschaft und einen lokalen Agent-
    Turn.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, während Sie
    an einem Gast iterieren. Verwenden Sie `--json` für den Pfad des Zusammenfassungsartefakts und
    den Status pro Lane.
  - Der OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für die Live-Agent-Turn-Evidenz.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie absichtlich ein anderes
    OpenAI-Modell validieren.
  - Kapseln Sie lange lokale Läufe in ein Host-Timeout, damit Parallels-Transport-Stalls nicht
    den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten in Post-Update-doctor und Paket-
    Update-Arbeit verbringen; das ist weiterhin gesund, wenn das verschachtelte npm-
    Debug-Log voranschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel mit einzelnen Parallels-
    macOS-, Windows- oder Linux-Smoke-Lanes aus. Sie teilen sich VM-Zustand und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Gast-Gateway-Zustand kollidieren.
  - Die Post-Update-Evidenz führt die normale gebündelte Plugin-Oberfläche aus, weil
    Capability-Fassaden wie Sprache, Bilderzeugung und Medienverständnis
    über gebündelte Runtime-APIs geladen werden, selbst wenn der Agent-
    Turn selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protocol-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout - paketierte Installationen liefern `qa-lab` nicht mit.
  - Vollständige CLI, Profil-/Szenariokatalog, Umgebungsvariablen und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus und verwendet dabei die Driver- und SUT-Bot-Token aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte, gepoolte Zugangsdaten. Verwenden Sie standardmäßig den Env-Modus, oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu nutzen.
  - Die Defaults decken Canary, Mention-Gating, Befehlsadressierung, `/status`, erwähnte Bot-zu-Bot-Antworten und native Core-Befehlsantworten ab. Die `mock-openai`-Defaults decken außerdem deterministische Regressionen für Antwortketten und Telegram-Final-Message-Streaming ab. Verwenden Sie `--list-scenarios` für optionale Probes wie `session_status`.
  - Beendet mit einem Exit-Code ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code erhalten möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Aktivieren Sie für stabile Bot-zu-Bot-Beobachtung den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot den Gruppen-Bot-Verkehr beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und `qa-evidence.json` unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten RTT von der Sendeanforderung des Drivers bis zur beobachteten SUT-Antwort.

`Mantis Telegram Live` ist der PR-Evidence-Wrapper um diese Lane. Er führt den Candidate-Ref mit per Convex geleasten Telegram-Zugangsdaten aus, rendert das redigierte QA-Berichts-/Evidence-Bundle in einem Crabbox-Desktop-Browser, zeichnet MP4-Evidence auf, erzeugt ein bewegungsgetrimmtes GIF, lädt das Artefakt-Bundle hoch und postet Inline-PR-Evidence über die Mantis GitHub App, wenn `pr_number` gesetzt ist. Maintainer können ihn über die Actions-UI mit `Mantis Scenario` (`scenario_id:
telegram-live`) oder direkt aus einem Pull-Request-Kommentar starten:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` ist der agentische native Telegram Desktop Before/After-Wrapper für visuellen PR-Proof. Starten Sie ihn über die Actions-UI mit freiformatigen `instructions`, über `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) oder aus einem PR-Kommentar:

```text
@openclaw-mantis telegram desktop proof
```

Der Mantis-Agent liest den PR, entscheidet, welches Telegram-sichtbare Verhalten die Änderung belegt, führt die echte Crabbox-Telegram-Desktop-Proof-Lane mit realem Benutzer auf Baseline- und Candidate-Refs aus, iteriert, bis die nativen GIFs nützlich sind, schreibt ein gepaartes `motionPreview`-Manifest und postet dieselbe zweispaltige GIF-Tabelle über die Mantis GitHub App, wenn `pr_number` gesetzt ist.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Least oder verwendet einen Crabbox-Linux-Desktop wieder, installiert den nativen Telegram Desktop, konfiguriert OpenClaw mit einem geleasten Telegram-SUT-Bot-Token, startet das Gateway und zeichnet Screenshot-/MP4-Evidence vom sichtbaren VNC-Desktop auf.
  - Verwendet standardmäßig `--credential-source convex`, sodass Workflows nur das Convex-Broker-Secret benötigen. Verwenden Sie `--credential-source env` mit denselben `OPENCLAW_QA_TELEGRAM_*`-Variablen wie `pnpm openclaw qa telegram`.
  - Telegram Desktop benötigt weiterhin ein Benutzer-Login/-Profil. Das Bot-Token konfiguriert nur OpenClaw. Verwenden Sie `--telegram-profile-archive-env <name>` für ein base64-kodiertes `.tgz`-Profilarchiv, oder verwenden Sie `--keep-lease` und melden Sie sich einmal manuell über VNC an.
  - Schreibt `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` und `telegram-desktop-builder.mp4` in das Ausgabeverzeichnis.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderdriften; die Coverage-Matrix pro Lane befindet sich in [QA-Überblick → Live-Transport-Coverage](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und nicht Teil dieser Matrix.

### Gemeinsame Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für Live-Transport-QA aktiviert ist, bezieht QA Lab einen exklusiven Lease aus einem Convex-gestützten Pool, sendet Heartbeats für diesen Lease, während die Lane läuft, und gibt den Lease beim Herunterfahren frei. Der Abschnittsname ist älter als die Unterstützung für Discord, Slack und WhatsApp; der Lease-Vertrag wird typenübergreifend gemeinsam genutzt.

Referenz-Scaffold für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Zugangsdatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Default: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-Convex-URLs mit `http://` für ausschließlich lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Adminbefehle (Pool hinzufügen/entfernen/auflisten) erfordern ausdrücklich `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets, Endpoint-Präfix, HTTP-Timeout und Admin-/List-Erreichbarkeit zu prüfen, ohne Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-Hilfsprogrammen.

Default-Endpoint-Vertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Schutz bei aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID als String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

Payload-Form für Telegram-Real-User-Kind:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` und `telegramApiId` müssen numerische Strings sein.
- `tdlibArchiveSha256` und `desktopTdataArchiveSha256` müssen SHA-256-Hex-Strings sein.
- `kind: "telegram-user"` ist für den Mantis-Telegram-Desktop-Proof-Workflow reserviert. Generische QA-Lab-Lanes dürfen es nicht abrufen.

Vom Broker validierte Mehrkanal-Payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-Lanes können ebenfalls aus dem Pool leasen, aber die Slack-Payload-Validierung befindet sich derzeit im Slack-QA-Runner statt im Broker. Verwenden Sie `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` für Slack-Zeilen.

### Einen Channel zu QA hinzufügen

Die Architektur- und Szenario-Helfernamen für neue Channel-Adapter befinden sich in [QA-Überblick → Einen Channel hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Der Mindeststandard: Implementieren Sie den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam, deklarieren Sie `qaRunners` im Plugin-Manifest, mounten Sie ihn als `openclaw qa <runner>` und schreiben Sie Szenarien unter `qa/scenarios/`.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Default)

- Befehl: `pnpm test`
- Config: Nicht zielgerichtete Läufe verwenden das `vitest.full-*.config.ts`-Shard-Set und können Multi-Project-Shards für parallele Planung in Pro-Project-Configs erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten `unit-ui`-Shard
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Config)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites `api.js`- und `runtime-api.js`-Fallback-Verhalten mit generierten winzigen Plugin-Fixtures belegen, nicht mit echten gebündelten Plugin-Source-APIs. Echte Plugin-API-Ladevorgänge gehören in Plugin-eigene Contract-/Integration-Suites.

Native-Dependency-Richtlinie:

- Default-Testinstallationen überspringen optionale native Discord-Opus-Builds. Discord-Voice verwendet das gebündelte `libopus-wasm`, und `@discordjs/opus` bleibt in `allowBuilds` deaktiviert, damit lokale Tests und Testbox-Lanes das native Addon nicht kompilieren.
- Vergleichen Sie native Opus-Performance im `libopus-wasm`-Benchmark-Repo, nicht in den Default-Install-/Test-Loops von OpenClaw. Setzen Sie `@discordjs/opus` nicht in den Default-`allowBuilds` auf `true`; dadurch würden nicht zusammenhängende Install-/Test-Loops nativen Code kompilieren.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Ein nicht zielgerichteter `pnpm test`-Lauf führt zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) aus, statt einen riesigen nativen Root-Projekt-Prozess zu verwenden. Das senkt den Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass auto-reply-/Extension-Arbeit nicht zusammenhängende Suites ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-Projektgraphen aus `vitest.config.ts`, weil eine Watch-Schleife über mehrere Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst über bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die volle Startlast des Root-Projekts bezahlt.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig in günstige bereichsbezogene Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Source-Zuordnungen und lokale Abhängige aus dem Importgraphen. Config-/Setup-/Package-Änderungen lösen keine breiten Testläufe aus, es sei denn, Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Check-Gate für eng begrenzte Arbeit. Es klassifiziert den Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; rufen Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise auf. Reine Versionsanhebungen in Release-Metadaten führen gezielte Versions-/Config-/Root-Dependency-Checks aus, mit einem Guard, der Package-Änderungen außerhalb des obersten Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Dry-Run des Live-Docker-Schedulers. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Änderungen an Dependencies, Exports, Versionen und anderen Package-Oberflächen verwenden weiterhin die breiteren Guards.
    - Importarme Unit-Tests aus agents, commands, plugins, auto-reply-Hilfsfunktionen, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte Helper-Quelldateien in `plugin-sdk` und `commands` ordnen changed-mode-Läufe außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Helper-Änderungen nicht die gesamte schwere Suite für dieses Verzeichnis erneut ausführen müssen.
    - `auto-reply` hat dedizierte Buckets für Core-Helfer auf oberster Ebene, `reply.*`-Integrationstests auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Shards für agent-runner, dispatch und commands/state-routing auf, damit ein importlastiger Bucket nicht den gesamten Node-Auslauf dominiert.
    - Normale PR-/main-CI überspringt bewusst den Extension-Batch-Sweep und den nur für Releases vorgesehenen `agentic-plugins`-Shard. Full Release Validation startet für diese Plugin-/Extension-lastigen Suites auf Release Candidates den separaten untergeordneten Workflow `Plugin Prerelease`.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Discovery-Eingaben für Message-Tools oder den Laufzeitkontext der Compaction ändern, behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Helper-Regressionen für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halten Sie die Integrations-Suites des eingebetteten Runners gesund:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` und
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin durch die echten `run.ts`- / `compact.ts`-Pfade fließen; reine Helper-Tests sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool und Isolationsvorgaben">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den nicht isolierten Runner für die Root-Projekte, e2e- und Live-Konfigurationen.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und den Optimizer, läuft aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard übernimmt dieselben Vorgaben `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um V8-Kompilieraufwand bei großen lokalen Läufen zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um gegen das Standardverhalten von V8 zu vergleichen.
    - `scripts/run-vitest.mjs` beendet explizite Vitest-Läufe ohne Watch nach 5 Minuten ohne stdout- oder stderr-Ausgabe. Setzen Sie `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, um den Watchdog für eine bewusst stille Untersuchung zu deaktivieren.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architekturlanes ein Diff auslöst.
    - Der Pre-Commit-Hook führt nur Formatierung aus. Er staged formatierte Dateien erneut und führt weder Lint noch Typecheck oder Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn Sie das intelligente lokale Check-Gate benötigen.
    - `pnpm test:changed` läuft standardmäßig über günstige bereichsbezogene Lanes. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent entscheidet, dass eine Änderung an Harness, Config, Package oder Vertrag wirklich breitere Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Die lokale automatische Worker-Skalierung ist absichtlich konservativ und fährt zurück, wenn die durchschnittliche Host-Last bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Config-Dateien als `forceRerunTriggers`, damit changed-mode-Wiederholungen korrekt bleiben, wenn sich die Testverdrahtung ändert.
    - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Reporting zur Importdauer plus Ausgabe der Import-Aufschlüsselung.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
    - Shard-Zeitdaten werden nach `.artifacts/vitest-shard-timings.json` geschrieben. Läufe über die gesamte Konfiguration verwenden den Config-Pfad als Schlüssel; Include-Pattern-CI-Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt werden können.
    - Wenn ein heißer Test weiterhin den Großteil seiner Zeit in Startup-Imports verbringt, halten Sie schwere Dependencies hinter einer schmalen lokalen `*.runtime.ts`-Grenze und mocken Sie diese Grenze direkt, statt Runtime-Helfer per Deep-Import nur durch `vi.mock(...)` zu reichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete `test:changed` mit dem nativen Root-Projektpfad für diesen committed Diff und gibt Wall Time plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen Dirty Tree, indem die geänderte Dateiliste durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest-/Vite-Startup und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU- und Heap-Profile für die Unit-Suite mit deaktivierter Datei-Parallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet einen echten Loopback-Gateway mit standardmäßig aktivierter Diagnostik
  - Treibt synthetischen Gateway-Message-, Memory- und Large-Payload-Durchsatz durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über das Gateway-WS-RPC ab
  - Deckt Persistenzhelfer für Diagnose-Stabilitäts-Bundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Warteschlangentiefen pro Session wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Schmale Lane für Follow-up zu Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

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
- Config: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und gebündelte Plugin-E2E-Tests unter `extensions/`
- Laufzeitvorgaben:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` zum Erzwingen der Worker-Anzahl (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateways mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und umfangreicheres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E (gemockter Control-UI-Browser)

- Befehl: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Dateien: `ui/src/**/*.e2e.test.ts`
- Umfang:
  - Startet die Vite Control UI
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
  - Nur opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Erfordert einen aktiven lokalen OpenShell-Gateway und dessen Config-Quelle
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend die Test-Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test beim manuellen Ausführen der breiteren e2e-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, um die registrierte Gateway-Config für den isolierten Test bereitzustellen
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, um die Docker-Gateway-IP zu überschreiben, die vom Host-Policy-Fixture verwendet wird

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Provider-Formatänderungen, Besonderheiten beim Tool-Calling, Authentifizierungsprobleme und Rate-Limit-Verhalten erkennen
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / nutzt Rate Limits
  - Bevorzugt eingegrenzte Teilmengen statt „alles“ ausführen
- Live-Läufe verwenden bereits exportierte API-Schlüssel und bereitgestellte Authentifizierungsprofile.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home, sodass Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet standardmäßig einen ruhigeren Modus: Die `[live] ...`-Fortschrittsausgabe bleibt erhalten, Gateway-Bootstrap-Logs/Bonjour-Rauschen werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startlogs wiederhaben möchten.
- API-Schlüsselrotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Live-spezifische Überschreibung über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, selbst wenn Vitests Konsolenerfassung leise ist.
  - `vitest.live.config.ts` deaktiviert Vitests Konsolenabfang, sodass Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Passen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Pairing berühren: Fügen Sie `pnpm test:e2e` hinzu
- „Mein Bot ist ausgefallen“ / Provider-spezifische Fehler / Tool-Calling debuggen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smokes, ACP-Smokes, den Codex-App-Server-
Harness und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) - plus Umgang mit Zugangsdaten für Live-Läufe - siehe
[Live-Suites testen](/de/help/testing-live). Die dedizierte Checkliste für Updates und
Plugin-Validierung finden Sie unter
[Updates und Plugins testen](/de/help/testing-updates-plugins).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner sind in zwei Gruppen aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Profil-Schlüssel-Live-Datei im Repo-Docker-Image aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis, der Workspace und eine optionale Profil-Env-Datei gemountet werden. Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner behalten bei Bedarf eigene praktische Obergrenzen bei:
  `test:docker:live-models` verwendet standardmäßig die kuratierte unterstützte High-Signal-Auswahl, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Setzen Sie `OPENCLAW_LIVE_MAX_MODELS`
  oder die Gateway-Env-Vars, wenn Sie ausdrücklich eine kleinere Obergrenze oder einen größeren Scan wünschen.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut/verwendet dann zwei `scripts/e2e/Dockerfile`-Images. Das Bare-Image ist nur der Node-/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorab gebauten Tarball. Das Functional-Image installiert denselben Tarball nach `/app` für Lanes zur Built-App-Funktionalität. Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer ist als die aktiven Obergrenzen, kann der Scheduler sie dennoch starten, wenn der Pool leer ist, und lässt sie dann allein laufen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig eine Docker-Preflight-Prüfung aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Status aus, speichert erfolgreiche Lane-Laufzeiten in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Laufzeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Bauen oder Ausführen von Docker auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“ Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt die ausgewählte Ref neu zu packen. Profile sind nach Breite geordnet: `smoke`, `package`, `product` und `full`. Siehe [Updates und Plugins testen](/de/help/testing-updates-plugins) für den Paket-/Update-/Plugin-Vertrag, die Survivor-Matrix für veröffentlichte Upgrades, Release-Standardeinstellungen und Fehlertriage.
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard durchläuft den statischen gebauten Graphen aus `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn der Start vor dem Dispatch Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor dem Befehlsdispatch importiert; außerdem hält er den gebündelten Gateway-Run-Chunk unter Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Der Paket-CLI-Smoke deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Model-List-Befehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Cutoff toleriert der Harness nur Metadatenlücken ausgelieferter Pakete: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, alte Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und Migration von Konfigurationsmetadaten während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.
- Docker-/Bash-E2E-Lanes, die den gepackten OpenClaw-Tarball über `scripts/lib/openclaw-e2e-instance.sh` installieren, begrenzen `npm install` auf `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (Standard `600s`; setzen Sie `0`, um den Wrapper zum Debuggen zu deaktivieren).

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Authentifizierungs-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, sodass externe CLI-OAuth Tokens aktualisieren kann, ohne den Authentifizierungsspeicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid-/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` und `pnpm qa:observability:smoke` sind private QA-Source-Checkout-Lanes. Sie sind absichtlich nicht Teil der Package-Docker-Release-Lanes, weil der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Channel-/Agent-Smoke: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI über Env-Ref-Onboarding sowie standardmäßig Telegram, führt Doctor aus und führt einen gemockten OpenAI-Agenten-Turn aus. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie den Channel mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` oder `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Release-User-Journey-Smoke: `pnpm test:docker:release-user-journey` installiert das gepackte OpenClaw-Tarball global in einem sauberen Docker-Home, führt das Onboarding aus, konfiguriert einen simulierten OpenAI-Provider, führt einen Agent-Turn aus, installiert/deinstalliert externe Plugins, konfiguriert ClickClack gegen eine lokale Fixture, verifiziert ausgehende/eingehende Nachrichten, startet den Gateway neu und führt Doctor aus.
- Release-Typed-Onboarding-Smoke: `pnpm test:docker:release-typed-onboarding` installiert das gepackte Tarball, steuert `openclaw onboard` über ein echtes TTY, konfiguriert OpenAI als env-ref-Provider, verifiziert, dass keine Rohschlüssel persistiert werden, und führt einen simulierten Agent-Turn aus.
- Release-Media/Memory-Smoke: `pnpm test:docker:release-media-memory` installiert das gepackte Tarball, verifiziert Bildverständnis aus einem PNG-Anhang, OpenAI-kompatible Ausgabe der Bilderzeugung, Memory-Suchabruf und das Überleben des Abrufs über einen Gateway-Neustart hinweg.
- Release-Upgrade-User-Journey-Smoke: `pnpm test:docker:release-upgrade-user-journey` installiert standardmäßig die neueste veröffentlichte Baseline, die älter als das Kandidaten-Tarball ist, konfiguriert Provider-/Plugin-/ClickClack-Zustand auf dem veröffentlichten Paket, aktualisiert auf das Kandidaten-Tarball und führt anschließend die zentrale Agent-/Plugin-/Channel-Journey erneut aus. Wenn keine ältere veröffentlichte Baseline existiert, wird die Kandidatenversion wiederverwendet. Überschreiben Sie die Baseline mit `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Release-Plugin-Marketplace-Smoke: `pnpm test:docker:release-plugin-marketplace` installiert aus einem lokalen Fixture-Marketplace, aktualisiert das installierte Plugin, deinstalliert es und verifiziert, dass die Plugin-CLI verschwindet und Installationsmetadaten bereinigt werden.
- Skill-Install-Smoke: `pnpm test:docker:skill-install` installiert das gepackte OpenClaw-Tarball global in Docker, deaktiviert Installationen hochgeladener Archive in der Konfiguration, löst den aktuellen Live-ClawHub-Skill-Slug aus der Suche auf, installiert ihn mit `openclaw skills install` und verifiziert den installierten Skill sowie `.clawhub`-Ursprungs-/Lock-Metadaten.
- Update-Channel-Switch-Smoke: `pnpm test:docker:update-channel-switch` installiert das gepackte OpenClaw-Tarball global in Docker, wechselt vom Paket-Channel `stable` zu Git `dev`, verifiziert den persistierten Channel und die Plugin-Funktion nach dem Update, wechselt dann zurück zum Paket-Channel `stable` und prüft den Update-Status.
- Upgrade-Survivor-Smoke: `pnpm test:docker:upgrade-survivor` installiert das gepackte OpenClaw-Tarball über eine schmutzige Old-User-Fixture mit Agents, Channel-Konfiguration, Plugin-Allowlists, veraltetem Plugin-Abhängigkeitszustand und vorhandenen Workspace-/Sitzungsdateien. Es führt Paket-Update plus nicht-interaktiven Doctor ohne Live-Provider- oder Channel-Schlüssel aus, startet anschließend einen Loopback-Gateway und prüft die Beibehaltung von Konfiguration/Zustand sowie Startup-/Status-Budgets.
- Published-Upgrade-Survivor-Smoke: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, befüllt realistische Dateien eines bestehenden Benutzers, konfiguriert diese Baseline mit einem eingebetteten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf das Kandidaten-Tarball, führt nicht-interaktiven Doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend einen Loopback-Gateway und prüft konfigurierte Intents, Zustandserhalt, Startup, `/healthz`, `/readyz` und RPC-Status-Budgets. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, weisen Sie den aggregierten Scheduler an, exakte lokale Baselines mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` zu erweitern, und erweitern Sie issue-förmige Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` wie `reported-issues`; das `reported-issues`-Set enthält `configured-plugin-installs` zur automatischen Reparatur externer OpenClaw-Plugin-Installationen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit, löst Meta-Baseline-Tokens wie `last-stable-4` oder `all-since-2026.4.23` auf, und Full Release Validation erweitert das Release-Soak-Paket-Gate auf `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Session-Runtime-Context-Smoke: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz versteckter Runtime-Context-Transkripte plus Doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Branches.
- Bun-Global-Install-Smoke: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängen zu bleiben. Wiederverwenden Sie ein vorgebautes Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache über seine Root-, Update- und Direct-npm-Container. Update-Smoke verwendet standardmäßig npm `latest` als stabile Baseline vor dem Upgrade auf das Kandidaten-Tarball. Überschreiben Sie lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit dem `update_baseline_version`-Input des Install-Smoke-Workflows. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache bei, damit root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Wiederholungen hinweg wiederzuverwenden.
- Install-Smoke-CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- Agents-Delete-Shared-Workspace-CLI-Smoke: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, befüllt zwei Agents mit einem Workspace in einem isolierten Container-Home, führt `agents delete --json` aus und verifiziert gültiges JSON sowie das Verhalten beibehaltener Workspaces. Wiederverwenden Sie das Install-Smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollensnapshots Link-URLs, cursor-promotete klickbare Elemente, iframe-Refs und Frame-Metadaten abdecken.
- OpenAI-Responses-web_search-Regression für minimales Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen simulierten OpenAI-Server über Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann eine Ablehnung durch das Provider-Schema und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Channel-Bridge (befüllter Gateway + stdio-Bridge + roher Claude-Notification-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter OpenClaw-Profil-Allow/Deny-Smoke): `pnpm test:docker:agent-bundle-mcp-tools` (Skript: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Cleanup (echter Gateway + stdio-MCP-Child-Teardown nach isolierten Cron- und One-Shot-Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-/Update-Smoke für lokalen Pfad, `file:`, npm-Registry mit hochgezogenen Abhängigkeiten, fehlerhafte npm-Paketmetadaten, bewegliche Git-Refs, ClawHub-Kitchen-Sink, Marketplace-Updates und Claude-Bundle-Aktivieren/Inspect): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das Standard-Kitchen-Sink-Paket-/Runtime-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Plugin-Update-Unchanged-Smoke: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-Lifecycle-Matrix-Smoke: `pnpm test:docker:plugin-lifecycle-matrix` installiert das gepackte OpenClaw-Tarball in einem leeren Container, installiert ein npm-Plugin, schaltet Enable/Disable um, führt Upgrades und Downgrades über eine lokale npm-Registry durch, löscht den installierten Code und verifiziert anschließend, dass Uninstall weiterhin veralteten Zustand entfernt, während RSS-/CPU-Metriken für jede Lifecycle-Phase protokolliert werden.
- Config-Reload-Metadata-Smoke: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Install-/Update-Smoke für lokalen Pfad, `file:`, npm-Registry mit hochgezogenen Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marketplace-Updates und Claude-Bundle-Aktivieren/Inspect ab. `pnpm test:docker:plugin-update` deckt unverändertes Update-Verhalten für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt ressourcenverfolgte npm-Plugin-Installation, Enable, Disable, Upgrade, Downgrade und Uninstall bei fehlendem Code ab.

Um das gemeinsame funktionale Image manuell vorzubauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsames Image verweist, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsam gebauten App-Runtime validieren.

Die Live-Modell-Docker-Runner binden den aktuellen Checkout außerdem schreibgeschützt ein und
stagen ihn in ein temporäres Arbeitsverzeichnis im Container. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihren exakten lokalen Quellcode/Ihre lokale Konfiguration läuft.
Der Staging-Schritt überspringt große, nur lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram/Discord/usw.-Channel-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus. Reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-Live-Abdeckung in dieser
Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein übergeordneter Kompatibilitäts-Smoke-Test: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen fest gepinnten Open WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den `/api/chat/completions`-Proxy von Open WebUI.
Setzen Sie `OPENWEBUI_SMOKE_MODE=models` für CI-Prüfungen im Release-Pfad, die nach
Open WebUI-Anmeldung und Modellerkennung stoppen sollen, ohne auf eine Live-Modell-
Completion zu warten.
Der erste Lauf kann spürbar langsamer sein, da Docker möglicherweise das
Open WebUI-Image ziehen muss und Open WebUI eventuell seine eigene Cold-Start-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modell-Schlüssel. Stellen Sie ihn über die Prozess-
Umgebung, gestagte Auth-Profile oder eine explizite `OPENCLAW_PROFILE_FILE` bereit.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen mit Seed-Daten versehenen Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` spawnt, und
verifiziert dann geroutete Konversationserkennung, Transkript-Lesezugriffe, Anhangsmetadaten,
Live-Event-Queue-Verhalten, Outbound-Sende-Routing sowie Channel- und
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test validiert, was die
Bridge tatsächlich ausgibt, nicht nur, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:agent-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Schlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete OpenClaw-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie filtern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Schlüssel. Es startet ein mit Seed-Daten versehenes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen einmaligen `sessions_spawn`-Child-Turn aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Plain-Language-Thread-Smoke-Test (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regression-/Debug-Workflows. Es kann erneut für die ACP-Thread-Routing-Validierung benötigt werden, löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...`, gemountet und vor dem Ausführen der Tests eingelesen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur aus `OPENCLAW_PROFILE_FILE` eingelesene Umgebungsvariablen zu verifizieren, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), nach `/home/node/.npm-global` für gecachte CLI-Installationen in Docker gemountet
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für Wiederholungsläufe wiederzuverwenden, die keinen Rebuild benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profilspeicher kommen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das fest gepinnte Open WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Docs-Änderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anker-Validierung aus, wenn Sie auch seiteninterne Überschriftenprüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „echte Pipeline“-Regressionen ohne echte Provider:

- Gateway-Tool-Aufrufe (Mock-OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Aufrufe über das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistenten-Flows, die Session-Verkabelung und Konfigurationswirkungen validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent die richtige Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrstufige Szenarien, die Tool-Reihenfolge, Übernahme der Session-Historie und Sandbox-Grenzen prüfen.

Künftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesezugriffe und Session-Verkabelung zu prüfen.
- Eine kleine Suite Skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, per Umgebung gated) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Form)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder registrierte Channel seinem
Interface-Vertrag entspricht. Sie iterieren über alle gefundenen Plugins und führen eine Suite von
Form- und Verhaltensassertions aus. Die Standard-Unit-Lane `pnpm test` überspringt diese gemeinsamen
Seam- und Smoke-Dateien absichtlich. Führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Channel- oder Provider-Oberflächen berühren.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (id, name, capabilities)
- **setup** - Vertrag des Einrichtungsassistenten
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Channel-Action-Handler
- **threading** - Thread-ID-Behandlung
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Provider-Status-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-Status-Probes
- **registry** - Plugin-Registry-Form

### Provider-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Modellkatalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/-Interface
- **wizard** - Einrichtungsassistent

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Subpfaden
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactorings der Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassung der exakten Request-Shape-Transformation)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng und machen Sie ihn per Umgebungsvariablen opt-in
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Fehler abfängt:
  - Fehler bei Provider-Request-Konvertierung/-Replay → direkter Modelltest
  - Fehler in Gateway-Session-/Historie-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse ein gesampeltes Ziel aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und stellt dann sicher, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue `includeInPlan`-SecretRef-Zielfamilie hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt bei nicht klassifizierten Ziel-IDs absichtlich fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
- [CI](/de/ci)
