---
read_when:
    - Tests lokal oder in der CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Debugging des Gateway- und Agentenverhaltens
summary: 'Testkit: Unit-/E2E-/Live-Test-Suites, Docker-Runner und was die einzelnen Tests abdecken'
title: Tests
x-i18n:
    generated_at: "2026-07-24T04:36:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20e0aa22bf16561334f83342abffabb387ed0b41b901773939123ecfbc0ae330
    source_path: help/testing.md
    workflow: 16
---

OpenClaw verfügt über drei Vitest-Suiten (Unit-/Integrationstests, E2E, Live) sowie Docker-
Runner. Diese Seite beschreibt, was die einzelnen Suiten abdecken, welcher Befehl für einen
bestimmten Workflow auszuführen ist, wie Live-Tests Anmeldedaten ermitteln und wie
Regressionstests für reale Provider-/Modellfehler hinzugefügt werden.

<Note>
Der **QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** wird separat dokumentiert:

- [QA-Übersicht](/de/concepts/qa-e2e-automation) – Architektur, Befehlsoberfläche, Szenarioerstellung und Matrix-Profile.
- [Reifegrad-Scorecard](/de/maturity/scorecard) – wie QA-Nachweise für Releases Stabilitäts- und LTS-Entscheidungen unterstützen.
- [QA-Kanal](/de/channels/qa-channel) – das synthetische Transport-Plugin für Repository-gestützte Szenarien.

Diese Seite behandelt die regulären Testsuiten und Docker-/Parallels-Runner. [QA-spezifische Runner](#qa-specific-runners) unten führt die konkreten `qa`-Aufrufe auf und verweist auf die obigen Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständige Prüfung (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Die direkte Dateiauswahl leitet auch Plugin-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie bei der Untersuchung eines einzelnen Fehlers zunächst gezielte Läufe.
- Docker-gestützte QA-Umgebung: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit wünschen:

- Informativer V8-Coverage-Bericht: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

## Temporäre Testverzeichnisse

Verwenden Sie die gemeinsamen Hilfsfunktionen in `test/helpers/temp-dir.ts` für testverwaltete temporäre
Verzeichnisse, damit die Zuständigkeit eindeutig ist und die Bereinigung Teil des Testlebenszyklus bleibt:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("verwendet einen temporären Arbeitsbereich", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // Arbeitsbereich verwenden
});
```

`useAutoCleanupTempDirTracker(afterEach)` stellt absichtlich keine manuelle
Bereinigungsmethode bereit – Vitest übernimmt die Bereinigung nach jedem Test. Ältere Low-Level-
Hilfsfunktionen (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) sind weiterhin
für noch nicht migrierte Tests vorhanden; vermeiden Sie deren neue Verwendung sowie neue direkte
`fs.mkdtemp*`-Aufrufe, sofern ein Test nicht ausdrücklich das unverarbeitete Verhalten temporärer
Verzeichnisse überprüft. Wenn ein direkt erstelltes temporäres Verzeichnis tatsächlich erforderlich ist, fügen Sie einen prüfbaren Zulassungskommentar
mit Begründung hinzu:

```ts
// openclaw-temp-dir: allow überprüft das unverarbeitete Bereinigungsverhalten des Dateisystems
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` meldet in neu hinzugefügten Diff-Zeilen die direkte Erstellung temporärer Verzeichnisse
und die neue manuelle Verwendung gemeinsamer Hilfsfunktionen, ohne
bestehende Bereinigungsmethoden zu blockieren. Dabei wird dieselbe Klassifizierung von Testpfaden
wie bei `scripts/changed-lanes.mjs` verwendet und die Implementierung der gemeinsamen Hilfsfunktion
selbst übersprungen. `check:changed` führt diesen Bericht für geänderte Testpfade als
reines CI-Warnsignal aus (GitHub-Warnanmerkungen, keine Fehler).

## Live- und Docker-/Parallels-Workflows

Beim Debuggen realer Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle sowie Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine Live-Datei mit minimaler Ausgabe auswählen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Berichte zur Laufzeitleistung: Starten Sie `OpenClaw Performance` mit
  `live_openai_candidate=true` für einen echten `openai/gpt-5.6-luna`-Agentendurchlauf oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Täglich geplante Läufe
  veröffentlichen Berichte für die Mock-Provider-, Deep-Profile- und GPT-5.6-Luna-Lanes unter
  `openclaw/clawgrit-reports` über einen separaten Publisher-Job, der Artefakte verarbeitet;
  eine fehlende oder ungültige Publisher-Authentifizierung lässt geplante und
  `profile=release`-Läufe fehlschlagen. Manuelle Dispatches außerhalb von Releases behalten die GitHub-Artefakte
  und behandeln die Veröffentlichung von Berichten als optional. Der Mock-Provider-Bericht enthält außerdem
  Kennzahlen zu Gateway-Start auf Quellcodeebene, Arbeitsspeicher, Plugin-Last, wiederholten
  Fake-Modell-Hello-Schleifen und CLI-Start.
- Docker-Live-Modellprüfung: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt einen Textdurchlauf sowie eine kleine Prüfung nach Art eines Dateilesevorgangs aus.
    Modelle, deren Metadaten `image`-Eingaben ausweisen, führen außerdem einen kleinen Bilddurchlauf aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Sowohl der tägliche `OpenClaw Scheduled Live And E2E Checks`- als auch der manuelle
    `OpenClaw Release Checks`-Lauf ruft den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, der nach Provider aufgeteilte
    Docker-Live-Modellmatrix-Jobs enthält.
  - Starten Sie für gezielte CI-Wiederholungsläufe `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie zu `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten bzw. Release-Aufrufern hinzu.
- Nativer Codex-Smoke-Test für gebundene Chats: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane für den Codex-App-Server-Pfad aus, bindet eine
    synthetische Slack-Direktnachricht mit `/codex bind`, führt `/codex fast` und
    `/codex permissions` aus und überprüft anschließend, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geleitet werden.
- Smoke-Test des Codex-App-Server-Testsystems: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agentendurchläufe über das Plugin-eigene Codex-App-Server-
    Testsystem aus, überprüft `/codex status` und `/codex models` und
    führt standardmäßig Bild-, Cron-MCP-, Sub-Agent- und Guardian-Prüfungen aus. Deaktivieren Sie die
    Sub-Agent-Prüfung mit `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie
    andere Fehler isolieren. Deaktivieren Sie für eine gezielte Sub-Agent-Prüfung die
    anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Der Vorgang wird nach der Sub-Agent-Prüfung beendet, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht festgelegt ist.
- Smoke-Test der bedarfsgesteuerten Codex-Installation: `pnpm test:docker:codex-on-demand`
  - Installiert das paketierte OpenClaw-Tarball in Docker, führt das
    Onboarding mit einem OpenAI-API-Schlüssel aus und überprüft, dass das Codex-Plugin sowie die Abhängigkeit
    `@openai/codex` bei Bedarf in das verwaltete npm-Projektstammverzeichnis heruntergeladen wurden.
- Live-Paket-Smoke-Test des Codex-npm-Plugins: `pnpm test:docker:live-codex-npm-plugin`
  - Installiert das OpenClaw-Kandidatenpaket und das exakte Codex-Plugin in Docker
    und verwendet anschließend einen echten OpenAI-Schlüssel für die CLI-Vorabprüfung und Durchläufe in derselben Sitzung.
  - Der anschließende Durchlauf mit mittlerer Denkintensität und ohne Wiederholungsversuche muss Fortschritt melden, die Arbeit
    mit zufälligen Lesevorgängen im Arbeitsbereich und dem exakten Schreiben eines Artefakts fortsetzen
    und anschließend den Abschluss melden. Ein terminaler Durchlauf, der ausschließlich Fortschritt meldet, lässt die Lane fehlschlagen.
- Live-Smoke-Test für Plugin-Tool-Abhängigkeiten: `pnpm test:docker:live-plugin-tool`
  - Paketiert ein Fixture-Plugin mit einer echten `slugify`-Abhängigkeit, installiert es
    über `npm-pack:`, überprüft die Abhängigkeit im verwalteten npm-
    Projektstammverzeichnis und fordert anschließend ein reales OpenAI-Modell auf, das Plugin-Tool aufzurufen und
    den verborgenen Slug zurückzugeben.
- Smoke-Test des OpenClaw-Rettungsbefehls: `pnpm test:live:system-agent-rescue-channel`
  - Optionale zusätzliche Sicherheitsprüfung für die Rettungsbefehlsoberfläche
    des Nachrichtenkanals. Führt `/openclaw status` aus, stellt eine dauerhafte Modelländerung
    in die Warteschlange, antwortet mit `/openclaw yes` und überprüft den Schreibpfad für Audit und Konfiguration.
- Docker-Smoke-Test für den ersten OpenClaw-Start: `pnpm test:docker:system-agent-first-run`
  - Beginnt mit einem leeren OpenClaw-Zustandsverzeichnis und weist zunächst nach, dass die paketierte
    `openclaw setup`-CLI ohne Inferenz sicher fehlschlägt. Anschließend
    wird Fake Claude über das paketierte Aktivierungsmodul getestet und aktiviert.
    Erst danach erreicht eine unscharfe paketierte CLI-Anfrage den Planer und
    wird in eine typisierte Einrichtung aufgelöst, gefolgt von einmaligen Modell-, Agenten-, Discord-Konfigurations-
    und SecretRef-Vorgängen. Dabei werden Konfigurations- und Audit-Einträge validiert. Dies sind
    ergänzende Nachweise für Gate und Vorgänge, nicht für interaktives Onboarding oder
    OpenClaw-Agenten-, Tool- bzw. Genehmigungsabläufe. Dieselbe Lane ist in QA Lab über
    `pnpm openclaw qa suite --scenario system-agent-ring-zero-setup` verfügbar.
- Moonshot-/Kimi-Kosten-Smoke-Test: Führen Sie bei gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus und anschließend einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`-Lauf
  für `moonshot/kimi-k2.6`. Überprüfen Sie, dass der JSON-Bericht Moonshot/K2.6 ausweist und das
  Assistententranskript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen einzelnen fehlgeschlagenen Fall benötigen, grenzen Sie Live-Tests vorzugsweise über die unten beschriebenen Allowlist-Umgebungsvariablen ein.
</Tip>

## QA-spezifische Runner

Diese Befehle ergänzen die Haupttestsuiten, wenn Sie die Realitätsnähe von QA Lab benötigen.

Die CI führt QA Lab in dedizierten Workflows aus. Agentische Parität ist unter
`QA-Lab - All Lanes` und der Release-Validierung eingebettet und kein eigenständiger PR-Workflow.
Für eine umfassende Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Prüfungen verwendet werden. Stabile/standardmäßige Release-
Prüfungen belassen umfassende Live-/Docker-Dauertests hinter `run_release_soak=true`; das
Profil `full` erzwingt deren Ausführung. `QA-Lab - All Lanes` wird jede Nacht für `main` sowie
über einen manuellen Dispatch ausgeführt, wobei die Mock-Paritäts-Lane, die Live-Matrix-Lane,
die von Convex verwaltete Live-Telegram-Lane und die von Convex verwaltete Live-Discord-Lane als
parallele Jobs laufen. Geplante QA- und Release-Prüfungen führen das Matrix-Release-Profil
über den gemeinsamen Live-Adapter aus. Die Matrix-CLI und die manuelle Workflow-Eingabe
verwenden weiterhin standardmäßig `all`; manuelle `all`-Dispatches verteilen sich auf die Transport-, Medien- und
E2EE-Profile, während gezielte Dispatches `fast`, `release` oder
`transport` auswählen können. `OpenClaw Release Checks` führt vor der Release-Freigabe die Paritätsprüfung sowie das wiederverwendbare
Matrix-Live-Adapter-Profil und die Telegram-Lane aus. Release-
Transportprüfungen verwenden `mock-openai/gpt-5.6-luna`, damit sie deterministisch bleiben und
den normalen Start von Provider-Plugins vermeiden. Diese Live-Transport-Gateways
deaktivieren die Speichersuche; das Speicherverhalten wird weiterhin durch die QA-Paritätssuiten abgedeckt.

Vollständige Live-Medien-Shards für Releases verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
`ghcr.io/openclaw/openclaw-live-test:<sha>`-Image, das einmal pro ausgewähltem
Commit erstellt und anschließend mit `OPENCLAW_SKIP_DOCKER_BUILD=1` abgerufen wird, statt es
in jedem Shard neu zu erstellen.

- `pnpm openclaw qa suite`
  - Führt Repository-gestützte QA-Szenarien direkt auf dem Host aus.
  - Schreibt übergeordnete Artefakte für `qa-evidence.json`, `qa-suite-summary.json` und
    `qa-suite-report.md` für die ausgewählte Szenariomenge, einschließlich
    Auswahlen von Mixed-Flow-, Vitest- und Playwright-Szenarien.
  - Bei Auslösung durch `pnpm openclaw qa run --qa-profile <profile>` wird
    die Scorecard des ausgewählten Taxonomieprofils in dasselbe `qa-evidence.json` eingebettet.
    `smoke-ci` schreibt kompakte Nachweise (`evidenceMode: "slim"`, kein
    `execution` pro Eintrag). `release` deckt den kuratierten Ausschnitt zur Release-Bereitschaft ab; `all`
    wählt jede aktive Reifekategorie aus und zielt auf explizite Workflow-Auslösungen für
    QA-Profilnachweise ab, wenn ein vollständiges Scorecard-Artefakt benötigt wird.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Parallelität von 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker
    anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Wird mit einem von null verschiedenen Status beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures` für
    Artefakte ohne einen fehlschlagenden Exit-Code.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen, AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    Lane `mock-openai` zu ersetzen.
- `pnpm openclaw qa coverage --match <query>`
  - Durchsucht Szenario-IDs, Titel, Oberflächen, Abdeckungs-IDs, Dokumentationsreferenzen, Code-
    Referenzen, Plugins und Provider-Anforderungen und gibt anschließend passende Suite-
    Ziele aus.
  - Verwenden Sie dies vor einem QA-Lab-Lauf, wenn Sie das betroffene Verhalten oder den Dateipfad
    kennen, aber nicht das kleinste Szenario. Nur als Empfehlung – wählen Sie weiterhin Mock-,
    Live-, Multipass-, Matrix- oder Transportnachweise anhand des geänderten
    Verhaltens aus.
- `pnpm test:plugins:kitchen-sink-live`
  - Führt den Live-Härtetest des OpenAI-Kitchen-Sink-Plugins über QA Lab aus.
    Installiert das externe Kitchen-Sink-Paket, überprüft das Oberflächeninventar des Plugin-SDK,
    prüft `/healthz` und `/readyz`, zeichnet Nachweise zur CPU-/RSS-Nutzung des Gateway
    auf, führt einen Live-OpenAI-Turn aus und prüft adversarielle
    Diagnosen. Erfordert eine Live-OpenAI-Authentifizierung wie `OPENAI_API_KEY`. In
    hydrierten Testbox-Sitzungen wird automatisch das Testbox-Profil für die Live-Authentifizierung
    eingelesen, wenn der Helfer `openclaw-testbox-env` vorhanden ist.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Start-Benchmark sowie ein kleines Paket von Mock-QA-Lab-Szenarien
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) aus und schreibt eine kombinierte Zusammenfassung der CPU-Beobachtungen
    unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltende Beobachtungen hoher CPU-Auslastung (`--cpu-core-warn`,
    Standardwert `0.9`; `--hot-wall-warn-ms`, Standardwert `30000`), sodass kurze Spitzen beim Start
    als Metriken aufgezeichnet werden, ohne wie die minutenlange
    Regression mit dauerhaft ausgelastetem Gateway zu wirken.
  - Wird mit erstellten `dist`-Artefakten ausgeführt; führen Sie zuerst einen Build aus, wenn der Checkout
    noch keine aktuellen Laufzeitausgaben enthält.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer temporären Multipass-Linux-VM aus und behält
    dieselben Flags für Szenarioauswahl und Provider/Modell wie `qa suite` bei.
  - Live-Läufe leiten die für den Gast praktikablen QA-Authentifizierungseingaben weiter:
    umgebungsbasierte Provider-Schlüssel, den Pfad zur Konfiguration des QA-Live-Providers und
    `CODEX_HOME`, sofern vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repository-Stammverzeichnis bleiben, damit der Gast
    über den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht samt Zusammenfassung sowie Multipass-Protokolle unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für QA-Arbeiten im Operator-Stil.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Erstellt aus dem aktuellen Checkout einen npm-Tarball, installiert ihn global in
    Docker, führt ein nicht interaktives Onboarding mit OpenAI-API-Schlüssel durch, konfiguriert
    standardmäßig Telegram, überprüft, dass die paketierte Plugin-Laufzeit ohne
    Reparatur von Startabhängigkeiten geladen wird, führt Doctor aus und führt einen lokalen Agent-Turn
    gegen einen simulierten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für die paketierte Installation
    mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Docker-Smoke-Test der erstellten App für eingebettete Laufzeitkontext-
    Transkripte aus. Überprüft, dass der ausgeblendete OpenClaw-Laufzeitkontext als
    nicht angezeigte benutzerdefinierte Nachricht erhalten bleibt, statt in den sichtbaren Benutzer-
    Turn einzufließen, legt anschließend eine betroffene defekte Sitzungs-JSONL an und überprüft, dass
    `openclaw doctor --fix` sie mit einer Sicherung auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt das Onboarding des installierten Pakets
    aus, konfiguriert Telegram über die installierte CLI und verwendet anschließend
    die Live-Telegram-QA-Lane erneut, wobei das installierte Paket als zu testendes
    Gateway dient.
  - Der Wrapper bindet aus dem Checkout nur den Harness-Quellcode `qa-lab` ein;
    das installierte Paket besitzt `dist`, `openclaw/plugin-sdk` und die gebündelte
    Plugin-Laufzeit, sodass die Lane keine Plugins des aktuellen Checkouts in
    das zu testende Paket mischt.
  - Verwendet standardmäßig `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um einen aufgelösten lokalen Tarball zu testen,
    statt ihn aus der Registry zu installieren.
  - Gibt standardmäßig mit `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`
    wiederholte RTT-Zeitmessungen in `qa-evidence.json` aus. Überschreiben Sie
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um den Lauf anzupassen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` wählt das Telegram-QA-Szenario aus, für das
    Stichproben genommen werden; das unterstützte RTT-Ziel ist `channel-canary`.
  - Verwendet dieselben Telegram-Umgebungszugangsdaten oder dieselbe Convex-Zugangsdatenquelle wie
    `pnpm openclaw qa telegram`. Setzen Sie für CI-/Release-Automatisierung
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` sowie
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in
    CI vorhanden sind, wählt der Docker-Wrapper Convex automatisch aus.
  - Der Wrapper validiert die Umgebungsvariablen für Telegram- oder Convex-Zugangsdaten auf dem Host,
    bevor Docker-Build-/Installationsarbeiten beginnen. Setzen Sie
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` nur, wenn Sie
    bewusst die Einrichtung vor der Bereitstellung der Zugangsdaten debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt
    das gemeinsame `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane. Wenn Convex-
    Zugangsdaten ausgewählt sind und keine Rolle festgelegt ist, verwendet der Wrapper `ci` in CI
    und `maintainer` außerhalb von CI.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er wird beim Merge nicht ausgeführt. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Zugangsdaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für parallel ausgeführte Produktnachweise
  gegen ein einzelnes Kandidatenpaket bereit. Akzeptiert werden eine Git-Referenz, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL samt SHA-256, eine Richtlinie für vertrauenswürdige URLs oder ein Tarball-Artefakt
  aus einem anderen Lauf (`source=ref|npm|url|trusted-url|artifact`). Das normalisierte
  `openclaw-current.tgz` wird als `package-under-test` hochgeladen; anschließend wird der
  vorhandene Docker-E2E-Scheduler mit den Lane-Profilen `smoke`, `package`, `product`, `full`
  oder `custom` ausgeführt. Setzen Sie `telegram_mode=mock-openai` oder
  `live-frontier`, um den Telegram-QA-Workflow gegen dasselbe
  `package-under-test`-Artefakt auszuführen.
  - Produktnachweis für die neueste Beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Der Nachweis mit exakter Tarball-URL erfordert einen Digest und verwendet die öffentliche Sicherheitsrichtlinie für URLs:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Unternehmensinterne/private Tarball-Spiegel verwenden eine explizite Richtlinie für vertrauenswürdige Quellen:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` liest `.github/package-trusted-sources.json` aus der vertrauenswürdigen Workflow-Referenz und akzeptiert weder URL-Zugangsdaten noch eine Umgehung des privaten Netzwerks über eine Workflow-Eingabe. Wenn die benannte Richtlinie Bearer-Authentifizierung deklariert, konfigurieren Sie das festgelegte Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Der Artefaktnachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das
    Gateway mit konfiguriertem OpenAI und aktiviert anschließend gebündelte Kanäle/Plugins durch
    Konfigurationsänderungen.
  - Überprüft, dass bei der Einrichtungserkennung nicht konfigurierte herunterladbare Plugins
    fehlen, die erste konfigurierte Doctor-Reparatur jedes fehlende
    herunterladbare Plugin explizit installiert und ein zweiter Neustart keine
    ausgeblendete Abhängigkeitsreparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor
    der Ausführung von `openclaw update --tag <candidate>` und überprüft, dass
    Doctor des Kandidaten nach dem Update veraltete Überreste von Plugin-Abhängigkeiten
    ohne eine Harness-seitige Postinstall-Reparatur bereinigt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Aktualisierungs-Smoke-Test für paketierte Installationen auf Parallels-Gästen aus.
    Jede ausgewählte Plattform installiert zunächst das angeforderte Baseline-Paket,
    führt anschließend den installierten Befehl `openclaw update` im selben Gast aus und
    überprüft die installierte Version, den Aktualisierungsstatus, die Gateway-Bereitschaft und
    einen lokalen Agent-Turn.
  - Verwenden Sie beim Iterieren auf einem einzelnen Gast `--platform macos`, `--platform windows` oder `--platform linux`.
    Verwenden Sie `--json` für den Pfad des Zusammenfassungsartefakts
    und den Status pro Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.6-luna` für den Nachweis des Live-Agent-Turns.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, um ein anderes OpenAI-Modell zu validieren.
  - Umschließen Sie lange lokale Läufe mit einem Host-Timeout, damit Transportstillstände von Parallels
    nicht das verbleibende Testzeitfenster verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Protokolle unter
    `/tmp/openclaw-parallels-npm-update.*`. Prüfen Sie `windows-update.log`,
    `macos-update.log` oder `linux-update.log`, bevor Sie davon ausgehen, dass der äußere
    Wrapper hängt.
  - Die Windows-Aktualisierung kann auf einem kalten Gast 10 bis 15 Minuten für Doctor nach der Aktualisierung und
    die Paketaktualisierung benötigen; dies ist weiterhin ein ordnungsgemäßer Zustand, solange das
    verschachtelte npm-Debugprotokoll fortgeschrieben wird.
  - Führen Sie diesen aggregierenden Wrapper nicht parallel zu einzelnen Parallels-
    Smoke-Lanes für macOS, Windows oder Linux aus. Sie verwenden gemeinsam den VM-Zustand und können
    bei der Snapshot-Wiederherstellung, der Paketbereitstellung oder dem Gateway-Zustand des Gasts
    kollidieren.
  - Der Nachweis nach der Aktualisierung führt die normale Oberfläche gebündelter Plugins aus, da
    Funktionsfassaden wie Sprachausgabe, Bilderzeugung und Medien-
    verständnis über gebündelte Laufzeit-APIs geladen werden, selbst wenn der Agent-
    Turn selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen kurzlebigen Docker-gestützten Tuwunel-
    Homeserver aus. Nur im Quellcode-Checkout – paketierte Installationen enthalten
    `qa-lab` nicht.
  - Vollständige CLI, Profil-/Szenariokatalog, Umgebungsvariablen und Artefaktstruktur:
    [Matrix-Smoke-Lanes](/de/concepts/qa-e2e-automation#matrix-smoke-lanes).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus und verwendet dabei die
    Treiber- und SUT-Bot-Tokens aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische
    Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten.
    Verwenden Sie standardmäßig den Umgebungsmodus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`,
    um gepoolte Leases zu aktivieren.
  - Die Standardwerte decken Canary, Mention-Gating, Befehlsadressierung, `/status`,
    erwähnte Bot-zu-Bot-Antworten und native Kernbefehlsantworten ab.
    Die Standardwerte von `mock-openai` decken außerdem deterministische Antwortketten- und
    Telegram-Regressionen beim Streaming der endgültigen Nachricht ab. Verwenden Sie `--list-scenarios`
    für optionale Prüfungen wie `session_status`.
  - Wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures` für
    Artefakte ohne einen fehlerhaften Exit-Code.
  - Erfordert zwei verschiedene Bots in derselben privaten Gruppe, wobei der SUT-Bot
    einen Telegram-Benutzernamen bereitstellt.
  - Aktivieren Sie für eine stabile Bot-zu-Bot-Beobachtung den Bot-to-Bot Communication Mode
    in `@BotFather` für beide Bots und stellen Sie sicher, dass der Treiber-Bot
    den Bot-Datenverkehr der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und `qa-evidence.json` unter
    `.artifacts/qa-e2e/...`. Antwortszenarien enthalten die RTT von der Sendeanfrage
    des Treibers bis zur beobachteten SUT-Antwort.

`Mantis Telegram Live` ist der PR-Nachweis-Wrapper für diese Lane. Er führt
die Kandidaten-Ref mit von Convex geleasten Telegram-Anmeldedaten aus, rendert das
redigierte QA-Berichts-/Nachweispaket in einem Crabbox-Desktopbrowser, zeichnet MP4-
Nachweise auf, erzeugt ein um bewegungslose Abschnitte gekürztes GIF, lädt das Artefaktpaket hoch und
veröffentlicht Inline-PR-Nachweise über die Mantis GitHub App, wenn `pr_number`
gesetzt ist. Maintainer können ihn über die Actions-Benutzeroberfläche mit `Mantis Scenario`
(`scenario_id: telegram-live`) oder direkt über einen Pull-Request-Kommentar starten:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
```

`Mantis Telegram Desktop Proof` ist der agentische native Vorher-/Nachher-Wrapper für Telegram Desktop
zum visuellen PR-Nachweis. Starten Sie ihn über die Actions-Benutzeroberfläche mit
frei formuliertem `instructions`, über `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) oder über einen PR-Kommentar:

```text
@openclaw-mantis telegram desktop proof
```

Der Mantis-Agent liest den PR, entscheidet, welches in Telegram sichtbare Verhalten die
Änderung nachweist, führt die Crabbox-Telegram-Desktop-Nachweis-Lane für echte Benutzer mit
Basis- und Kandidaten-Refs aus, iteriert, bis die nativen GIFs aussagekräftig sind,
schreibt ein gepaartes `motionPreview`-Manifest und veröffentlicht dieselbe zweispaltige GIF-
Tabelle über die Mantis GitHub App, wenn `pr_number` gesetzt ist.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Least einen Crabbox-Linux-Desktop oder verwendet ihn erneut, installiert den nativen Telegram
    Desktop, konfiguriert OpenClaw mit einem geleasten Telegram-SUT-Bot-Token,
    startet das Gateway und zeichnet Screenshot-/MP4-Nachweise vom
    sichtbaren VNC-Desktop auf.
  - Verwendet standardmäßig `--credential-source convex`, sodass Workflows nur das
    Convex-Broker-Secret benötigen. Verwenden Sie `--credential-source env` mit denselben
    `OPENCLAW_QA_TELEGRAM_*`-Variablen wie `pnpm openclaw qa telegram`.
  - Telegram Desktop benötigt weiterhin eine Benutzeranmeldung bzw. ein Benutzerprofil. Das Bot-Token
    konfiguriert nur OpenClaw. Verwenden Sie `--telegram-profile-archive-env <name>`
    für ein Base64-`.tgz`-Profilarchiv oder verwenden Sie `--keep-lease` und melden Sie sich
    einmal manuell über VNC an.
  - Schreibt `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` und `telegram-desktop-builder.mp4`
    unter das Ausgabeverzeichnis.

Live-Transport-Lanes verwenden einen gemeinsamen Standardvertrag, damit neue Transporte nicht
auseinanderlaufen; die Abdeckungsmatrix pro Lane befindet sich in der
[QA-Übersicht – Live-Transport-Abdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` ist die breite synthetische Suite und gehört nicht zu dieser Matrix.

### Gemeinsam genutzte Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
für Live-Transport-QA aktiviert ist, erwirbt das QA-Lab eine exklusive Lease aus einem
Convex-gestützten Pool, sendet während der Ausführung der Lane Heartbeats für diese Lease und
gibt die Lease beim Herunterfahren frei. Der Abschnittsname stammt aus der Zeit vor der Unterstützung von Discord, Slack und
WhatsApp; der Lease-Vertrag wird von allen Typen gemeinsam verwendet.

Referenzgerüst für das Convex-Projekt: `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Umgebungsstandard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, andernfalls `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standardwert `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standardwert `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standardwert `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standardwert `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standardwert `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs für die ausschließlich lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im Normalbetrieb `https://` verwenden.

Admin-Befehle für Maintainer (Pool hinzufügen/entfernen/auflisten) erfordern ausdrücklich
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsbefehle für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Ausführungen, um die Convex-Site-URL, Broker-Secrets,
das Endpunktpräfix, das HTTP-Timeout und die Erreichbarkeit von Admin-/Listenfunktionen zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgaben in Skripten und CI-
Hilfsprogrammen.

Standardmäßiger Endpunktvertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Anfragen authentifizieren sich mit einem `Authorization: Bearer <role secret>`-Header;
die folgenden Bodys lassen diesen Header aus:

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Ausgeschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Schutz für aktive Leases: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Struktur für den Typ Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID-Zeichenfolge sein.
- `admin/add` validiert diese Struktur für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

Payload-Struktur für den Typ Telegram-Echtbenutzer:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` und `telegramApiId` müssen numerische Zeichenfolgen sein.
- `tdlibArchiveSha256` und `desktopTdataArchiveSha256` müssen SHA-256-Hexadezimalzeichenfolgen sein.
- `kind: "telegram-user"` ist für den Mantis-Telegram-Desktop-Nachweis-Workflow reserviert. Generische QA-Lab-Lanes dürfen ihn nicht erwerben.

Vom Broker validierte Mehrkanal-Payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-Lanes können ebenfalls Leases aus dem Pool beziehen, aber die Slack-Payload-Validierung
befindet sich derzeit im Slack-QA-Runner und nicht im Broker. Verwenden Sie
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
für Slack-Zeilen.

### Einen Kanal zur QA hinzufügen

Die Architektur und die Namen der Szenario-Hilfsfunktionen für neue Kanaladapter befinden sich in der
[QA-Übersicht – Einen Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel).
Die Mindestanforderung: Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-
Nahtstelle, fügen Sie ein `adapterFactory` für gemeinsame Szenarien hinzu, deklarieren Sie `qaRunners` im
Plugin-Manifest, mounten Sie es als `openclaw qa <runner>` und erstellen Sie Szenarien unter
`qa/scenarios/`.

## Testsuiten (was wo ausgeführt wird)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Instabilität/Kosten).

### Unit-/Integrationstests (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Ausführungen verwenden den `vitest.full-*.config.ts`-Shard-Satz und können
  Shards mit mehreren Projekten für die parallele
  Planung in projektbezogene Konfigurationen aufteilen
- Dateien: Kern-/Unit-Inventare unter `src/**/*.test.ts`,
  `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests werden im
  dedizierten `unit-ui`-Shard ausgeführt
- Umfang:
  - Reine Unit-Tests
  - Prozessinterne Integrationstests (Gateway-Authentifizierung, Routing, Werkzeuge, Parsing, Konfiguration)
  - Deterministische Regressionstests für bekannte Fehler
- Erwartungen:
  - Wird in CI ausgeführt
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Loader-Tests für öffentliche Oberflächen müssen das breite Fallback-Verhalten von `api.js` und
    `runtime-api.js` mit generierten kleinen Plugin-Fixtures nachweisen,
    nicht mit echten Quell-APIs gebündelter Plugins. Ladevorgänge echter Plugin-APIs gehören in
    Plugin-eigene Vertrags-/Integrationssuiten.

Richtlinie für native Abhängigkeiten:

- Standardmäßige Testinstallationen überspringen optionale native Discord-Opus-Builds. Discord
  Voice verwendet das gebündelte `libopus-wasm`, und `@discordjs/opus` bleibt in
  `allowBuilds` deaktiviert, damit lokale Tests und Testbox-Lanes das native
  Add-on nicht kompilieren.
- Vergleichen Sie die Leistung des nativen Opus im `libopus-wasm`-Benchmark-Repository, nicht
  in standardmäßigen OpenClaw-Installations-/Testschleifen. Setzen Sie `@discordjs/opus` in der standardmäßigen `allowBuilds`
  nicht auf `true`; dadurch kompilieren nicht zugehörige Installations-/Testschleifen
  nativen Code.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsspezifische Lanes">

    - Nicht zielgerichtete `pnpm test` führt dreizehn kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Projekt-Prozesses aus. Dies reduziert den maximalen RSS auf ausgelasteten Rechnern und verhindert, dass Auto-Reply-/Plugin-Arbeit unabhängigen Test-Suites Ressourcen entzieht.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, da eine Watch-Schleife mit mehreren Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsspezifische Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` die vollständigen Startkosten des Root-Projekts vermeidet.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu kostengünstigen bereichsspezifischen Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Quellzuordnungen und abhängige Elemente des lokalen Importgraphen. Änderungen an Konfiguration, Einrichtung oder Paketen führen Tests nicht umfassend aus, sofern nicht ausdrücklich `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` verwendet wird.
    - `pnpm check:changed` ist das normale intelligente lokale Prüftor für eng begrenzte Arbeiten. Es klassifiziert den Diff in Core, Core-Tests, Erweiterungen, Erweiterungstests, Apps, Dokumentation, Release-Metadaten, Live-Docker-Tooling und Tooling und führt anschließend die passenden Befehle für Typprüfung, Linting und Schutzprüfungen aus. Vitest-Tests werden nicht ausgeführt; verwenden Sie `pnpm test:changed` oder ein explizites `pnpm test <target>` als Testnachweis. Versionsanhebungen, die ausschließlich Release-Metadaten betreffen, führen gezielte Versions-, Konfigurations- und Root-Abhängigkeitsprüfungen aus, einschließlich einer Schutzprüfung, die Paketänderungen außerhalb des obersten Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Testsystem führen gezielte Prüfungen aus: Shell-Syntax für die Live-Docker-Authentifizierungsskripte und einen Probelauf des Live-Docker-Schedulers. Änderungen an `package.json` werden nur berücksichtigt, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Änderungen an Abhängigkeiten, Exporten, Versionen und anderen Paketoberflächen verwenden weiterhin die umfassenderen Schutzprüfungen.
    - Importarme Unit-Tests aus Agents, Befehlen, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen Bereichen mit reinen Hilfsfunktionen werden über die Lane `unit-fast` geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete bzw. laufzeitintensive Dateien verbleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Hilfsquelldateien ordnen Ausführungen im Änderungsmodus außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Änderungen an Hilfsfunktionen nicht erneut die vollständige aufwendige Suite für dieses Verzeichnis ausführen.
    - `auto-reply` verfügt über eigene Gruppen für Core-Hilfsfunktionen der obersten Ebene, `reply.*`-Integrationstests der obersten Ebene und den `src/auto-reply/reply/**`-Unterbaum. Die CI unterteilt den Reply-Unterbaum zusätzlich in Shards für Agent-Runner, Dispatch und Befehls-/State-Routing, damit nicht eine einzige importintensive Gruppe den gesamten Node-Ausläufer belegt.
    - Die normale PR-/Main-CI überspringt absichtlich den Batch-Durchlauf für gebündelte Plugins und den ausschließlich für Releases vorgesehenen `agentic-plugins`-Shard. Die vollständige Release-Validierung startet für diese Plugin-intensiven Test-Suites bei Release-Kandidaten den separaten untergeordneten Workflow `Plugin Prerelease`.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Eingaben für die Erkennung von Nachrichtentools oder den Laufzeitkontext der Compaction ändern,
      behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie gezielte Regressionstests für reine Routing- und Normalisierungsgrenzen
      hinzu.
    - Halten Sie die Integrations-Suites des eingebetteten Runners funktionsfähig:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` und
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites überprüfen, dass bereichsspezifische IDs und das Compaction-Verhalten weiterhin
      die echten Pfade `run.ts` / `compact.ts` durchlaufen; reine Hilfsfunktionstests sind
      kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Standardwerte für Vitest-Pool und -Isolation">

    - Die Vitest-Basiskonfiguration verwendet standardmäßig `threads`.
    - Die gemeinsam genutzte Vitest-Konfiguration legt `isolate: false` fest und verwendet den
      nicht isolierten Runner in den Root-Projekten sowie den E2E- und Live-Konfigurationen.
    - Die Root-UI-Lane behält ihre Einrichtung und ihren Optimierer `jsdom` bei, wird jedoch ebenfalls auf dem
      gemeinsam genutzten nicht isolierten Runner ausgeführt.
    - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false`
      aus der gemeinsam genutzten Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für untergeordnete Vitest-Node-Prozesse
      hinzu, um den V8-Kompilierungsaufwand bei großen lokalen Ausführungen zu reduzieren.
      Legen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1` fest, um mit dem standardmäßigen V8-Verhalten
      zu vergleichen.
    - `scripts/run-vitest.mjs` beendet explizite Vitest-Ausführungen außerhalb des Watch-Modus
      nach 5 Minuten ohne Ausgabe auf stdout oder stderr. Legen Sie
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` fest, um den Watchdog für
      eine absichtlich stille Untersuchung zu deaktivieren.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architekturlanes ein Diff auslöst.
    - Der Pre-Commit-Hook führt ausschließlich Formatierungen aus. Er fügt formatierte Dateien erneut zum Staging-Bereich hinzu
      und führt weder Linting noch Typprüfungen oder Tests aus.
    - Führen Sie vor der Übergabe oder dem Push explizit `pnpm check:changed` aus, wenn Sie
      das intelligente lokale Prüftor benötigen.
    - `pnpm test:changed` wird standardmäßig über kostengünstige bereichsspezifische Lanes geleitet. Verwenden Sie
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent
      entscheidet, dass eine Änderung am Testsystem, an der Konfiguration, am Paket oder am Vertrag tatsächlich
      eine umfassendere Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten
      bei, lediglich mit einer höheren Worker-Obergrenze.
    - Die automatische Skalierung lokaler Worker ist absichtlich konservativ und wird zurückgefahren,
      wenn der Lastdurchschnitt des Hosts bereits hoch ist, sodass mehrere gleichzeitige
      Vitest-Ausführungen standardmäßig weniger Beeinträchtigungen verursachen.
    - Die Vitest-Basiskonfiguration kennzeichnet die Projekt-/Konfigurationsdateien als
      `forceRerunTriggers`, damit erneute Ausführungen im Änderungsmodus korrekt bleiben, wenn sich die
      Testverdrahtung ändert.
    - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf
      unterstützten Hosts aktiviert; legen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      fest, um einen expliziten Cache-Speicherort für direktes Profiling anzugeben.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert die Berichterstattung über Vitest-Importdauern sowie
      eine Aufschlüsselung der Importe.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf
      Dateien, die seit `origin/main` geändert wurden.
    - Shard-Zeitdaten werden in `.artifacts/vitest-shard-timings.json` geschrieben.
      Ausführungen der gesamten Konfiguration verwenden den Konfigurationspfad als Schlüssel; CI-Shards
      mit Include-Mustern hängen den Shard-Namen an, sodass gefilterte Shards separat
      verfolgt werden können.
    - Wenn ein aufwendiger Test weiterhin den Großteil seiner Zeit mit Startimporten verbringt,
      belassen Sie umfangreiche Abhängigkeiten hinter einer eng begrenzten lokalen `*.runtime.ts`-Naht und
      mocken Sie diese Naht direkt, anstatt Laufzeithilfen per Deep-Import einzubinden,
      nur um sie über `vi.mock(...)` weiterzureichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete
      `test:changed` mit dem nativen Root-Projekt-Pfad für diesen
      committeten Diff und gibt die verstrichene Zeit sowie den maximalen RSS unter macOS aus.
    - `pnpm test:perf:changed:bench -- --worktree` führt einen Benchmark des aktuellen
      nicht bereinigten Arbeitsbaums aus, indem die Liste geänderter Dateien über
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geleitet wird.
    - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Hauptthreads für
      den Startaufwand und Transformationsaufwand von Vitest/Vite.
    - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für
      die Unit-Suite bei deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` und `test/vitest/vitest.infra.config.ts`, jeweils auf einen Worker beschränkt
- Umfang:
  - Startet einen echten Loopback-Gateway mit standardmäßig aktivierter Diagnose
  - Leitet synthetische Gateway-Nachrichten-, Speicher- und Nutzlastaktivität mit großen Datenmengen durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über den Gateway-WS-RPC ab
  - Deckt Persistenzhilfen für das Diagnose-Stabilitätspaket ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Messwerte unter dem Belastungsbudget bleiben und die Warteschlangentiefen pro Sitzung wieder auf null zurückgehen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Eng begrenzte Lane zur Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Repo-Aggregat)

- Befehl: `pnpm test:e2e`
- Umfang:
  - Führt die E2E-Lane für Gateway-Smoke-Tests aus
  - Führt die Browser-E2E-Lane mit gemockter Control UI aus
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Erfordert eine installierte Playwright-Chromium-Version

### E2E (Gateway-Smoke-Test)

- Befehl: `pnpm test:e2e:gateway`
- Konfiguration: `test/vitest/vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeitstandardwerte:
  - Verwendet Vitest `threads` mit `isolate: false`, entsprechend dem restlichen Repo.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Wird standardmäßig im stillen Modus ausgeführt, um den Aufwand durch Konsolen-E/A zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um die ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateways mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Kopplung und aufwendigere Netzwerkvorgänge
- Erwartungen:
  - Wird in der CI ausgeführt (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als bei Unit-Tests (kann langsamer sein)

### E2E (gemockter Control-UI-Browser)

- Befehl: `pnpm test:ui:e2e`
- Konfiguration: `test/vitest/vitest.ui-e2e.config.ts`
- Dateien: `ui/src/**/*.e2e.test.ts`
- Umfang:
  - Startet die Vite Control UI
  - Steuert über Playwright eine echte Chromium-Seite
  - Ersetzt den Gateway-WebSocket durch deterministische In-Browser-Mocks
- Erwartungen:
  - Wird in der CI als Teil von `pnpm test:e2e` ausgeführt
  - Kein echter Gateway und keine echten Agents oder Provider-Schlüssel erforderlich
  - Die Browserabhängigkeit muss vorhanden sein (`pnpm --dir ui exec playwright install chromium`)

### E2E: Smoke-Test des OpenShell-Backends

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Verwendet einen aktiven lokalen OpenShell-Gateway wieder
  - Erstellt eine Sandbox aus einer temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Ausführung
  - Überprüft das kanonische Remote-Dateisystemverhalten über die Dateisystembrücke der Sandbox
- Erwartungen:
  - Nur nach expliziter Aktivierung; nicht Teil der standardmäßigen Ausführung von `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionsfähigen Docker-Daemon
  - Erfordert einen aktiven lokalen OpenShell-Gateway und dessen Konfigurationsquelle
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend die Test-Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test bei manueller Ausführung der umfassenderen E2E-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript anzugeben
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, um die registrierte Gateway-Konfiguration für den isolierten Test verfügbar zu machen
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, um die von der Host-Policy-Testvorrichtung verwendete Docker-Gateway-IP zu überschreiben

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `test/vitest/vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests für gebündelte Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Formatänderungen bei Providern, Besonderheiten bei Tool-Aufrufen, Authentifizierungsprobleme und das Verhalten bei Ratenbegrenzungen
- Erwartungen:
  - Bewusst nicht CI-stabil (reale Netzwerke, reale Provider-Richtlinien, Kontingente, Ausfälle)
  - Verursacht Kosten / beansprucht Ratenbegrenzungen
  - Führen Sie vorzugsweise eingeschränkte Teilmengen statt „alles“ aus
- Live-Ausführungen verwenden bereits exportierte API-Schlüssel und bereitgestellte Authentifizierungsprofile.
- Standardmäßig isolieren Live-Ausführungen weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home-Verzeichnis, damit Unit-Test-Fixtures Ihr tatsächliches `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests bewusst Ihr tatsächliches Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet standardmäßig einen ruhigeren Modus: Die Fortschrittsausgabe von `[live] ...` bleibt erhalten, während Gateway-Bootstrap-Protokolle und Bonjour-Meldungen unterdrückt werden. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie wieder die vollständigen Startprotokolle wünschen.
- Rotation von API-Schlüsseln (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Live-spezifische Überschreibung über `OPENCLAW_LIVE_*_KEY`; Tests wiederholen Anfragen bei Antworten aufgrund von Ratenbegrenzungen.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben Fortschrittszeilen auf stderr aus, damit lange Provider-Aufrufe sichtbar aktiv bleiben, selbst wenn die Konsolenerfassung von Vitest keine Ausgabe zeigt.
  - `test/vitest/vitest.live.config.ts` deaktiviert das Abfangen der Konsole durch Vitest, sodass Fortschrittszeilen von Provider und Gateway während Live-Ausführungen sofort gestreamt werden.
  - Passen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Heartbeats für Gateway/Prüfungen mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Beim Bearbeiten von Logik/Tests: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie umfangreiche Änderungen vorgenommen haben)
- Bei Änderungen an Gateway-Netzwerkkommunikation / WS-Protokoll / Kopplung: Fügen Sie `pnpm test:e2e` hinzu
- Beim Debuggen von „Mein Bot ist ausgefallen“ / providerspezifischen Fehlern / Tool-Aufrufen: Führen Sie eine eingeschränkte Ausführung von `pnpm test:live` durch

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smoke-Tests, ACP-Smoke-Tests, das Codex-App-Server-
Testsystem und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI,
Bild, Musik, Video, Medien-Testsystem) – einschließlich der Handhabung von Zugangsdaten für Live-Ausführungen

- siehe [Testen von Live-Suites](/de/help/testing-live). Die spezielle Checkliste zur Validierung von Updates und
  Plugins finden Sie unter
  [Testen von Updates und Plugins](/de/help/testing-updates-plugins).

## Docker-Runner (optionale Prüfungen für „funktioniert unter Linux“)

Diese Docker-Runner sind in zwei Kategorien unterteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen innerhalb des Docker-Images des Repositorys (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`) nur die Live-Datei aus, die dem jeweiligen Profilschlüssel entspricht, und binden dabei Ihr lokales Konfigurationsverzeichnis, Ihren Workspace sowie eine optionale Profil-Umgebungsdatei ein. Die entsprechenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner behalten bei Bedarf eigene praxisgerechte Obergrenzen bei:
  `test:docker:live-models` verwendet standardmäßig die kuratierte, unterstützte Auswahl mit hoher Aussagekraft, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Setzen Sie `OPENCLAW_LIVE_MAX_MODELS`
  oder die Gateway-Umgebungsvariablen, wenn Sie ausdrücklich eine niedrigere Obergrenze oder einen umfangreicheren Scan wünschen.
- `test:docker:all` erstellt das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal über `scripts/package-openclaw-for-docker.mjs` als npm-Tarball und erstellt/verwendet anschließend zwei `scripts/e2e/Dockerfile`-Images. Das Basis-Image ist lediglich der Node-/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes binden den vorab erstellten Tarball ein. Das Funktions-Image installiert denselben Tarball für Funktions-Lanes der gebauten Anwendung unter `/app`. Die Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert die Prozessplätze, während Ressourcenobergrenzen verhindern, dass ressourcenintensive Live-, npm-Installations- und Mehrdienst-Lanes gleichzeitig starten. Ist eine einzelne Lane ressourcenintensiver als nach den aktiven Obergrenzen zulässig, kann der Scheduler sie dennoch starten, wenn der Pool leer ist, und lässt sie anschließend allein weiterlaufen, bis wieder Kapazität verfügbar ist. Die Standardwerte sind 10 Plätze, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (sowie andere `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`-Überschreibungen) nur an, wenn der Docker-Host über mehr Kapazitätsreserven verfügt. Der Runner führt standardmäßig eine Docker-Vorabprüfung durch, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aus, speichert die Laufzeiten erfolgreicher Lanes in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Laufzeiten, um bei späteren Ausführungen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest auszugeben, ohne Docker zu bauen oder auszuführen, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für die Frage „Funktioniert dieser installierbare Tarball als Produkt?“. Es bestimmt ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url`, `source=trusted-url` oder `source=artifact`, lädt es als `package-under-test` hoch und führt anschließend die wiederverwendbaren Docker-E2E-Lanes mit genau diesem Tarball aus, anstatt die ausgewählte Referenz erneut zu packen. Die Profile sind nach Umfang geordnet: `smoke`, `package`, `product` und `full` (sowie `custom` für eine explizite Lane-Liste). Informationen zum Paket-/Update-/Plugin-Vertrag, zur Überlebensmatrix veröffentlichter Upgrades, zu Release-Standardwerten und zur Fehleranalyse finden Sie unter [Testen von Updates und Plugins](/de/help/testing-updates-plugins).
- Build- und Release-Prüfungen führen nach tsdown `scripts/check-cli-bootstrap-imports.mjs` aus. Die Schutzprüfung durchläuft den statischen gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn dieser Bootstrap-Graph vor der Befehlsweiterleitung statisch ein externes Paket importiert (Commander, Prompt-UI, undici, Protokollierung und ähnliche startintensive Abhängigkeiten zählen alle dazu); außerdem begrenzt sie den gebündelten Gateway-Ausführungs-Chunk auf 70 KB und weist statische Importe bekannter kalter Gateway-Pfade (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) aus diesem Chunk zurück. `scripts/release-check.ts` führt separat Smoke-Tests für die gepackte CLI mit `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` und `models list --provider openai` durch.
- Die Legacy-Kompatibilität der Paketabnahme ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Grenzwert toleriert das Testsystem ausschließlich Metadatenlücken in ausgelieferten Paketen: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patchdateien in der aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, veraltete Speicherorte für Plugin-Installationsdatensätze, fehlende Persistenz von Marketplace-Installationsdatensätzen und die Migration von Konfigurationsmetadaten während `plugins update`. Bei Paketen nach `2026.4.25` führen diese Pfade strikt zu Fehlern.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und überprüfen übergeordnete Integrationspfade.
- Docker-/Bash-E2E-Lanes, die den gepackten OpenClaw-Tarball über `scripts/lib/openclaw-e2e-instance.sh` installieren, begrenzen `npm install` auf `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (Standardwert `600s`; setzen Sie `0`, um den Wrapper für das Debugging zu deaktivieren).

Die Live-Modell-Docker-Runner binden außerdem nur die erforderlichen CLI-Authentifizierungs-Home-Verzeichnisse ein
(oder alle unterstützten, wenn die Ausführung nicht eingeschränkt ist) und kopieren sie anschließend vor der Ausführung in das
Home-Verzeichnis des Containers, damit OAuth für externe CLIs Tokens aktualisieren kann,
ohne den Authentifizierungsspeicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Abdeckung für Droid/OpenCode über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-Test des Codex-App-Server-Testsystems: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungsagent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Tests: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` und `pnpm qa:observability:smoke` sind private QA-Lanes für Quellcode-Checkouts. Sie sind bewusst nicht Teil der Paket-Docker-Release-Lanes, da der npm-Tarball QA Lab auslässt.
- Open-WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständige Gerüsterstellung): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Kanal-/Agent-Smoke-Test: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI über ein Onboarding mit Umgebungsreferenz sowie standardmäßig Telegram, führt doctor aus und führt einen simulierten OpenAI-Agentendurchlauf aus. Verwenden Sie einen vorab erstellten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` erneut, überspringen Sie den erneuten Host-Build mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` oder `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke-Test der Release-Benutzerabläufe: `pnpm test:docker:release-user-journey` installiert den gepackten OpenClaw-Tarball global in einem sauberen Docker-Home-Verzeichnis, führt das Onboarding aus, konfiguriert einen simulierten OpenAI-Provider, führt einen Agent-Turn aus, installiert/deinstalliert externe Plugins, konfiguriert ClickClack mit einer lokalen Fixture, überprüft aus- und eingehende Nachrichten, startet den Gateway neu und führt Doctor aus.
- Smoke-Test des typisierten Release-Onboardings: `pnpm test:docker:release-typed-onboarding` installiert den gepackten Tarball, steuert `openclaw onboard` über ein echtes TTY, konfiguriert OpenAI als Env-Ref-Provider, überprüft, dass kein Rohschlüssel dauerhaft gespeichert wird, und führt einen simulierten Agent-Turn aus.
- Smoke-Test für Medien/Speicher im Release: `pnpm test:docker:release-media-memory` installiert den gepackten Tarball und überprüft die Bilderkennung anhand eines PNG-Anhangs, die Ausgabe OpenAI-kompatibler Bilderzeugung, den Abruf über die Speichersuche und den Fortbestand des Abrufs nach einem Gateway-Neustart.
- Smoke-Test der Upgrade-Benutzerabläufe im Release: `pnpm test:docker:release-upgrade-user-journey` installiert standardmäßig die neueste veröffentlichte Basisversion, die älter als der Kandidaten-Tarball ist, konfiguriert Provider-, Plugin- und ClickClack-Zustand im veröffentlichten Paket, führt ein Upgrade auf den Kandidaten-Tarball durch und wiederholt anschließend die zentralen Agent-, Plugin- und Kanalabläufe. Wenn keine ältere veröffentlichte Basisversion vorhanden ist, wird die Kandidatenversion wiederverwendet. Überschreiben Sie die Basisversion mit `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke-Test des Plugin-Marktplatzes im Release: `pnpm test:docker:release-plugin-marketplace` installiert aus einer lokalen Marktplatz-Fixture, aktualisiert das installierte Plugin, deinstalliert es und überprüft, dass die Plugin-CLI verschwindet und die Installationsmetadaten bereinigt werden.
- Smoke-Test der Skill-Installation: `pnpm test:docker:skill-install` installiert den gepackten OpenClaw-Tarball global in Docker, deaktiviert in der Konfiguration Installationen hochgeladener Archive, ermittelt über die Suche den aktuellen Live-Skill-Slug von ClawHub, installiert ihn mit `openclaw skills install` und überprüft den installierten Skill sowie die Herkunfts-/Sperrmetadaten von `.clawhub`.
- Smoke-Test des Update-Kanalwechsels: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt vom Paket `stable` zu Git `dev`, überprüft den persistierten Kanal und die Plugin-Funktion nach dem Update, wechselt anschließend zurück zum Paket `stable` und prüft den Update-Status.
- Smoke-Test für Upgrade-Beständigkeit: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über einer veränderten Fixture eines alten Benutzers mit Agents, Kanalkonfiguration, Plugin-Zulassungslisten, veraltetem Plugin-Abhängigkeitszustand und vorhandenen Workspace-/Sitzungsdateien. Der Test führt ein Paket-Update sowie Doctor nicht interaktiv und ohne Live-Provider- oder Kanalschlüssel aus, startet anschließend einen Loopback-Gateway und prüft die Beibehaltung von Konfiguration und Zustand sowie die Budgets für Start und Status.
- Smoke-Test für Beständigkeit nach einem veröffentlichten Upgrade: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, legt realistische Dateien eines bestehenden Benutzers an, konfiguriert diese Basisversion mit einem integrierten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf den Kandidaten-Tarball, führt Doctor nicht interaktiv aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend einen Loopback-Gateway und prüft konfigurierte Absichten, Zustandserhaltung, Start, `/healthz`, `/readyz` und RPC-Statusbudgets. Überschreiben Sie eine Basisversion mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, veranlassen Sie den aggregierten Scheduler mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, exakte lokale Basisversionen wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` zu erweitern, und erweitern Sie problembezogene Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, beispielsweise `reported-issues`; die Gruppe gemeldeter Probleme enthält `configured-plugin-installs` für die automatische Reparatur der Installation externer OpenClaw-Plugins. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit, löst Meta-Basisversionstoken wie `last-stable-4` oder `all-since-2026.4.23` auf, und Full Release Validation erweitert den Paket-Gate des Release-Dauertests auf `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke-Test des Sitzungslaufzeitkontexts: `pnpm test:docker:session-runtime-context` überprüft die Persistenz des Transkripts des ausgeblendeten Laufzeitkontexts sowie die Doctor-Reparatur betroffener duplizierter Prompt-Umschreibungszweige.
- Smoke-Test der globalen Bun-Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Quellbaum, installiert ihn mit `bun install -g` in einem isolierten Home-Verzeichnis und überprüft, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängen zu bleiben. Verwenden Sie einen vorab erstellten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` aus einem erstellten Docker-Image.
- Docker-Smoke-Test des Installers: `bash scripts/test-install-sh-docker.sh` verwendet für seine Root-, Update- und direkten npm-Container einen gemeinsamen npm-Cache. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Basisversion, bevor das Upgrade auf den Kandidaten-Tarball erfolgt. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Installer-Prüfungen ohne Root-Rechte verwenden weiterhin einen isolierten npm-Cache, damit Cache-Einträge im Besitz von Root das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direkt-npm-Cache bei lokalen Wiederholungen wiederzuverwenden.
- Install-Smoke-CI überspringt das duplizierte globale Direkt-npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Umgebungsvariable aus, wenn eine direkte Abdeckung von `npm install -g` erforderlich ist.
- CLI-Smoke-Test zum Löschen eines gemeinsam genutzten Agent-Workspace: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) erstellt standardmäßig das Image aus dem Root-Dockerfile, legt zwei Agents mit einem Workspace in einem isolierten Container-Home-Verzeichnis an, führt `agents delete --json` aus und überprüft gültiges JSON sowie das Verhalten bei beibehaltenem Workspace. Verwenden Sie das Install-Smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` wieder.
- Gateway-Netzwerk und Host-Lebenszyklus: `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`) behält den LAN-WebSocket-Smoke-Test für Authentifizierung und Zustand mit zwei Containern bei und weist anschließend über Loopback-Admin-HTTP Prepare-Fencing, Zugriff mit beibehaltener Steuerung, Wiederherstellung beim Fortsetzen und einen vorbereiteten Stopp/Start im selben Container nach. Die Neustartprüfung muss abgeschlossen sein, bevor die ursprüngliche Lease abläuft. Sie überprüft, dass der Suspendierungszustand prozesslokal ist, während die persistierte Gateway-Konfiguration und Containeridentität erhalten bleiben, und gibt maschinenlesbares JSON mit Phasenzeitmessungen aus.
- Smoke-Test für Browser-CDP-Snapshots: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) erstellt das Quell-E2E-Image sowie eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und überprüft, dass CDP-Rollensnapshots Link-URLs, durch den Cursor zu klickbaren Elementen hochgestufte Elemente, Iframe-Referenzen und Frame-Metadaten abdecken.
- Regression bei minimalem Reasoning für OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen simulierten OpenAI-Server über den Gateway aus, überprüft, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt anschließend die Ablehnung durch das Provider-Schema und prüft, ob das unverarbeitete Detail in den Gateway-Protokollen erscheint.
- MCP-Kanalbrücke (vorbereiteter Gateway + stdio-Brücke + Smoke-Test mit rohem Claude-Benachrichtigungsframe): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-Tools des OpenClaw-Bundles (echter stdio-MCP-Server + Smoke-Test für Zulassen/Ablehnen des eingebetteten OpenClaw-Profils): `pnpm test:docker:agent-bundle-mcp-tools` (Skript: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- MCP-Bereinigung für Cron/Subagent (echter Gateway + Beendigung des stdio-MCP-Kindprozesses nach isolierten Cron- und einmaligen Subagent-Ausführungen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Installations-/Update-Smoke-Test für lokalen Pfad, `file:`, npm-Registry mit hochgezogenen Abhängigkeiten, fehlerhafte Metadaten von npm-Paketen, wechselnde Git-Referenzen, ClawHub-Kitchen-Sink, Marktplatz-Updates und Aktivierung/Inspektion des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Paket/Laufzeit-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Smoke-Test für unveränderte Plugin-Updates: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-Test der Plugin-Lebenszyklusmatrix: `pnpm test:docker:plugin-lifecycle-matrix` installiert den gepackten OpenClaw-Tarball in einem einfachen Container, installiert ein npm-Plugin, schaltet es zwischen aktiviert und deaktiviert um, führt über eine lokale npm-Registry ein Upgrade und Downgrade durch, löscht den installierten Code und überprüft anschließend, dass die Deinstallation weiterhin veralteten Zustand entfernt, während für jede Lebenszyklusphase RSS-/CPU-Metriken protokolliert werden.
- Smoke-Test für Metadaten beim Neuladen der Konfiguration: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Installations-/Update-Smoke-Tests für lokalen Pfad, `file:`, npm-Registry mit hochgezogenen Abhängigkeiten, wechselnde Git-Referenzen, ClawHub-Fixtures, Marktplatz-Updates und die Aktivierung/Inspektion des Claude-Bundles ab. `pnpm test:docker:plugin-update` deckt das Verhalten unveränderter Updates für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt die ressourcenüberwachte Installation, Aktivierung, Deaktivierung, das Upgrade, Downgrade und die Deinstallation bei fehlendem Code von npm-Plugins ab.

So erstellen Sie das gemeinsam genutzte funktionale Image manuell vorab und verwenden es wieder:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Überschreibungen wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image verweist, laden die Skripte es herunter, sofern es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, da sie das Paket-/Installationsverhalten und nicht die gemeinsam genutzte Laufzeit der gebauten App validieren.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein
und stellen ihn in einem temporären Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das
Laufzeit-Image schlank, während Vitest dennoch mit Ihrem exakten lokalen
Quellcode und Ihrer exakten lokalen Konfiguration ausgeführt wird. Beim Bereitstellen werden große, nur lokal verwendete Caches und App-Build-
Ausgaben wie `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und
app-lokale `.build`- oder Gradle-Ausgabeverzeichnisse übersprungen, damit Docker-Live-Ausführungen nicht
mehrere Minuten mit dem Kopieren rechnerspezifischer Artefakte verbringen. Außerdem setzen sie
`OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes im Container keine echten
Telegram-/Discord-/usw.-Channel-Worker starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus. Reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-
Live-Abdeckung in dieser Docker-Lane einschränken oder ausschließen müssen.

`test:docker:openwebui` ist ein übergeordneter Kompatibilitäts-Smoke-Test: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen angehefteten Open-WebUI-Container, der dieses Gateway verwendet, meldet sich über
Open WebUI an, überprüft, dass `/api/models` `openclaw/default` bereitstellt, und sendet anschließend eine
echte Chat-Anfrage über den `/api/chat/completions`-Proxy von Open WebUI. Setzen Sie
`OPENWEBUI_SMOKE_MODE=models` für CI-Prüfungen des Release-Pfads, die
nach der Anmeldung bei Open WebUI und der Modellerkennung beendet werden sollen, ohne auf den Abschluss
einer Live-Modellanfrage zu warten. Die erste Ausführung kann merklich langsamer sein, da Docker möglicherweise
das Open-WebUI-Image herunterladen muss und Open WebUI eventuell zunächst seine eigene
Kaltstart-Einrichtung abschließen muss. Diese Lane erwartet einen verwendbaren Schlüssel für ein Live-Modell, der über
die Prozessumgebung, bereitgestellte Authentifizierungsprofile oder ein explizites
`OPENCLAW_PROFILE_FILE` bereitgestellt wird. Erfolgreiche Ausführungen geben eine kleine JSON-Nutzlast wie
`{ "ok": true, "model": "openclaw/default", ... }` aus.

`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen Gateway-
Container mit vordefinierten Daten und einen zweiten Container, der `openclaw mcp serve` erzeugt, und
überprüft anschließend die Erkennung weitergeleiteter Unterhaltungen, das Lesen von Transkripten, Anhangs-
metadaten, das Verhalten der Live-Ereigniswarteschlange, das Routing ausgehender Sendungen sowie Channel- und
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die
Benachrichtigungsprüfung untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test
validiert, was die Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK
zufällig bereitstellt.

`test:docker:agent-bundle-mcp-tools` ist deterministisch und benötigt keinen
Live-Modellschlüssel. Es erstellt das Docker-Image des Repositorys, startet einen echten stdio-MCP-
Probeserver im Container, stellt diesen Server über die
eingebettete MCP-Laufzeit des OpenClaw-Bundles bereit, führt das Tool aus und überprüft anschließend,
dass `coding` und `messaging` die `bundle-mcp`-Tools beibehalten, während `minimal` und
`tools.deny: ["bundle-mcp"]` sie herausfiltern.

`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-
Modellschlüssel. Es startet einen Gateway mit Ausgangsdaten und einem echten stdio-MCP-Probeserver,
führt einen isolierten Cron-Durchlauf und einen einmaligen untergeordneten `sessions_spawn`-Durchlauf aus und
überprüft anschließend, dass der untergeordnete MCP-Prozess nach jedem Durchlauf beendet wird.

Manueller ACP-Thread-Smoke-Test in natürlicher Sprache (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewahren Sie dieses Skript für Regressions-/Debugging-Workflows auf. Es könnte erneut für die Validierung des ACP-Thread-Routings benötigt werden; löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), eingebunden unter `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), eingebunden unter `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`, eingebunden und vor der Ausführung von Tests eingelesen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um ausschließlich aus `OPENCLAW_PROFILE_FILE` eingelesene Umgebungsvariablen zu überprüfen; dabei werden temporäre Konfigurations-/Workspace-Verzeichnisse und keine externen CLI-Authentifizierungseinbindungen verwendet
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`, sofern der Durchlauf nicht bereits ein CI-/verwaltetes Bind-Verzeichnis verwendet), eingebunden unter `/home/node/.npm-global` für zwischengespeicherte CLI-Installationen innerhalb von Docker
- Externe CLI-Authentifizierungsverzeichnisse/-dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und anschließend vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse (werden verwendet, wenn der Durchlauf nicht auf bestimmte Provider eingeschränkt ist): `.factory`, `.gemini`, `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingeschränkte Provider-Durchläufe binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Durchlauf einzuschränken
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für erneute Durchläufe wiederzuverwenden, die keine Neuerstellung benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass die Anmeldedaten aus dem Profilspeicher stammen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke-Test bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke-Test verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das festgelegte Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfung der Dokumentation

Führen Sie nach Änderungen an der Dokumentation die Dokumentationsprüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Ankervalidierung aus, wenn Sie auch Überschriften innerhalb von Seiten prüfen müssen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Toolaufruf (OpenAI-Mock, echter Gateway + Agentenschleife): `src/gateway/gateway.test.ts` (Fall: „führt einen OpenAI-Mock-Toolaufruf durch die Gateway-Agentenschleife vollständig aus“)
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Authentifizierung wird erzwungen): `src/gateway/gateway.test.ts` (Fall: „führt den Assistenten über ws aus und schreibt die Authentifizierungstoken-Konfiguration“)

## Zuverlässigkeits-Evaluierungen für Agenten (Skills)

Es gibt bereits einige CI-sichere Tests, die sich wie „Zuverlässigkeits-Evaluierungen für Agenten“ verhalten:

- Mock-Toolaufruf über den echten Gateway und die Agentenschleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die die Sitzungsanbindung und Konfigurationsauswirkungen validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wählt der Agent, wenn Skills im Prompt aufgeführt sind, den richtigen Skill (oder vermeidet irrelevante)?
- **Konformität:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt er die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Szenarien mit mehreren Durchläufen, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Künftige Evaluierungen sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern zur Prüfung von Toolaufrufen und deren Reihenfolge, Lesezugriffen auf Skill-Dateien sowie der Sitzungsanbindung.
- Eine kleine Suite Skill-orientierter Szenarien (verwenden oder vermeiden, Zugriffssteuerung, Prompt-Injection).
- Optionale Live-Evaluierungen (Opt-in, durch Umgebungsvariablen gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalstruktur)

Vertragstests überprüfen, ob jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie durchlaufen alle erkannten Plugins und führen eine
Suite von Struktur- und Verhaltensprüfungen aus. Der standardmäßige `pnpm test`-Unit-Testpfad
überspringt diese gemeinsamen Nahtstellen- und Smoke-Dateien absichtlich; führen Sie die Vertrags-
befehle ausdrücklich aus, wenn Sie gemeinsame Kanal- oder Provider-Oberflächen ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`. Aktuelle
Kategorien der obersten Ebene:

- **channel-catalog** – Metadaten für Einträge im gebündelten/registrierten Kanalkatalog
- **plugin** (registrierungsbasiert, geshardet) – grundlegende Struktur der Plugin-Registrierung
- **surfaces-only** (registrierungsbasiert, geshardet) – oberflächenspezifische Strukturprüfungen für `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` und `gateway`
- **session-binding** (registrierungsbasiert) – Verhalten der Sitzungsbindung
- **outbound-payload** – Struktur und Normalisierung der Nachrichtennutzlast
- **group-policy** (Fallback) – Durchsetzung der standardmäßigen Gruppenrichtlinie pro Kanal
- **threading** (registrierungsbasiert, geshardet) – Verarbeitung von Thread-IDs
- **directory** (registrierungsbasiert, geshardet) – Verzeichnis-/Teilnehmerlisten-API
- **registry** und **plugins-core.\*** – interne Abläufe der Kanal-Plugin-Registrierung, des Loaders und der Autorisierung von Konfigurationsschreibvorgängen

Die von diesen Suites verwendeten Hilfsfunktionen für die Erfassung eingehender Weiterleitungen
und die Nutzlast ausgehender Nachrichten werden intern über `src/plugin-sdk/channel-contract-testing.ts`
bereitgestellt (von npm ausgeschlossen, kein öffentlicher SDK-Unterpfad); in diesem Verzeichnis
gibt es keine eigenständige Datei `inbound.contract.test.ts`.

### Provider-Verträge

Befinden sich in `src/plugins/contracts/*.contract.test.ts`. Zu den aktuellen Kategorien
gehören:

- **shape** – Struktur von Plugin-Manifest, API und Laufzeitexporten
- **plugin-registration** (+ parallel) – Fälle der Manifestregistrierung
- **package-manifest** – Anforderungen an das Paketmanifest
- **loader** – Einrichtungs-/Bereinigungsverhalten des Plugin-Loaders
- **registry** – Inhalte und Suche der Plugin-Vertragsregistrierung
- **providers** – gemeinsames Provider-Verhalten für gebündelte Provider sowie Websuch-Provider
- **auth-choice** – Metadaten der Authentifizierungsauswahl und Einrichtungsverhalten
- **provider-catalog-deprecation** – Metadaten zu veralteten Provider-Katalogen
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** – Verträge des Provider-Einrichtungsassistenten
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** – funktionsspezifische Provider-Verträge
- **session-actions**, **session-attachments**, **session-entry-projection** – Plugin-eigene Verträge für den Sitzungsstatus
- **scheduled-turns** – Metadaten für geplante Plugin-Durchläufe und Zeitstempelgrenzen
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** – Verträge für Plugin-Host-/Laufzeitlebenszyklus und Importgrenzen
- **extension-runtime-dependencies** – Platzierung von Laufzeitabhängigkeiten für Erweiterungen

### Wann ausführen

- Nach Änderungen an Plugin-SDK-Exporten oder -Unterpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach der Umstrukturierung der Plugin-Registrierung oder -Erkennung

Vertragstests werden in CI ausgeführt und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Anleitung)

Wenn Sie ein im Live-Betrieb entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassung der exakten Transformation der Anfragestruktur)
- Wenn es sich grundsätzlich nur live testen lässt (Ratenbegrenzungen, Authentifizierungsrichtlinien), halten Sie den Live-Test eng begrenzt und machen Sie ihn über Umgebungsvariablen optional
- Zielen Sie vorzugsweise auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei der Konvertierung/Wiedergabe von Provider-Anfragen -> direkter Modelltest
  - Fehler in der Gateway-Sitzungs-/Verlaufs-/Tool-Pipeline -> Gateway-Live-Smoke-Test oder CI-sicherer Gateway-Mock-Test
- Schutzmechanismus für SecretRef-Traversierung:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registrierungsmetadaten (`listSecretTargetRegistryEntries()`) ein Stichprobenziel pro SecretRef-Klasse ab und prüft anschließend, ob Ausführungs-IDs mit Traversierungssegmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue `includeInPlan`-SecretRef-Zielfamilie hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt bei nicht klassifizierten Ziel-IDs absichtlich fehl, damit neue Klassen nicht unbemerkt übersprungen werden können.

## Verwandte Themen

- [Live-Tests](/de/help/testing-live)
- [Tests von Aktualisierungen und Plugins](/de/help/testing-updates-plugins)
- [CI](/de/ci)
