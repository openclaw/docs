---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Fehlerbehebung beim Verhalten von Gateway und Agenten
summary: 'Testkit: Unit-/E2E-/Live-Suiten, Docker-Runner und der Abdeckungsbereich der einzelnen Tests'
title: Testen
x-i18n:
    generated_at: "2026-07-12T15:25:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw verfügt über drei Vitest-Testreihen (Unit-/Integrationstests, E2E, Live) sowie Docker-
Runner. Diese Seite erläutert, was die einzelnen Testreihen abdecken, welcher Befehl für einen
bestimmten Workflow auszuführen ist, wie Live-Tests Anmeldedaten ermitteln und wie
Regressionstests für reale Provider-/Modellfehler hinzugefügt werden.

<Note>
Der **QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** wird separat dokumentiert:

- [QA-Übersicht](/de/concepts/qa-e2e-automation) – Architektur, Befehlsoberfläche und Erstellung von Szenarien.
- [Matrix-QA](/de/concepts/qa-matrix) – Referenz für `pnpm openclaw qa matrix`.
- [Reifegrad-Scorecard](/de/maturity/scorecard) – wie QA-Nachweise für Releases Stabilitäts- und LTS-Entscheidungen unterstützen.
- [QA-Kanal](/de/channels/qa-channel) – das synthetische Transport-Plugin, das von Repository-gestützten Szenarien verwendet wird.

Diese Seite behandelt die regulären Testreihen sowie Docker-/Parallels-Runner. [QA-spezifische Runner](#qa-specific-runners) führt weiter unten die konkreten `qa`-Aufrufe auf und verweist auf die obigen Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständige Prüfung (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellere lokale Ausführung der vollständigen Testreihe auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Die direkte Dateiauswahl leitet auch Plugin-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie bei der Arbeit an einem einzelnen Fehler zunächst gezielte Ausführungen.
- Docker-gestützte QA-Umgebung: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit wünschen:

- Informativer V8-Abdeckungsbericht: `pnpm test:coverage`
- E2E-Testreihe: `pnpm test:e2e`

## Temporäre Testverzeichnisse

Verwenden Sie die gemeinsamen Hilfsfunktionen in `test/helpers/temp-dir.ts` für testeigene temporäre
Verzeichnisse, damit die Zuständigkeit eindeutig ist und die Bereinigung im Testlebenszyklus verbleibt:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("verwendet einen temporären Arbeitsbereich", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // Arbeitsbereich verwenden
});
```

`useAutoCleanupTempDirTracker(afterEach)` stellt bewusst keine manuelle
Bereinigungsmethode bereit – Vitest übernimmt die Bereinigung nach jedem Test. Ältere, systemnähere
Hilfsfunktionen (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) sind für
Tests, die noch nicht migriert wurden, weiterhin vorhanden; vermeiden Sie ihre erneute Verwendung und neue direkte
`fs.mkdtemp*`-Aufrufe, sofern ein Test nicht ausdrücklich das unverarbeitete Verhalten temporärer Verzeichnisse
überprüft. Wenn ein direkt erstelltes temporäres Verzeichnis tatsächlich benötigt wird, fügen Sie einen überprüfbaren Zulassungskommentar
mit einer Begründung hinzu:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` meldet in neu hinzugefügten Diff-Zeilen die direkte Erstellung
temporärer Verzeichnisse und die neue manuelle Verwendung gemeinsamer Hilfsfunktionen, ohne
bestehende Bereinigungsstile zu blockieren. Das Skript verwendet dieselbe Klassifizierung von Testpfaden
wie `scripts/changed-lanes.mjs` und überspringt die Implementierung der gemeinsamen Hilfsfunktion
selbst. `check:changed` führt diesen Bericht für geänderte Testpfade als
reines CI-Warnsignal aus (GitHub-Warnanmerkungen, keine Fehler).

## Live- und Docker-/Parallels-Workflows

Beim Debuggen realer Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Testreihe (Modelle sowie Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine einzelne Live-Datei ohne ausführliche Ausgabe ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Berichte zur Laufzeitleistung: Starten Sie `OpenClaw Performance` mit
  `live_openai_candidate=true` für einen echten Agent-Durchlauf mit `openai/gpt-5.6-luna` oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Täglich geplante Ausführungen
  veröffentlichen Berichte der Mock-Provider-, Deep-Profile- und GPT-5.6-Luna-Lanes über
  einen separaten, Artefakte verarbeitenden Publisher-Job in `openclaw/clawgrit-reports`;
  fehlende oder ungültige Publisher-Authentifizierung führt bei geplanten Ausführungen und
  Ausführungen mit `profile=release` zu einem Fehler. Manuelle Nicht-Release-Ausführungen behalten die GitHub-Artefakte
  bei und behandeln die Veröffentlichung des Berichts als unverbindlich. Der Mock-Provider-Bericht enthält außerdem
  Messwerte zum Start des Gateways auf Quellcodeebene, zu Speicher, Plugin-Auslastung, wiederholten
  Fake-Modell-Hello-Schleifen und zum CLI-Start.
- Docker-Live-Modelllauf: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt einen Textdurchlauf sowie eine kleine Prüfung nach Art eines Dateilesevorgangs aus.
    Modelle, deren Metadaten eine `image`-Eingabe angeben, führen außerdem einen kleinen Bilddurchlauf aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Sowohl die tägliche Ausführung `OpenClaw Scheduled Live And E2E Checks` als auch die manuelle
    Ausführung `OpenClaw Release Checks` rufen den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf. Dieser umfasst eine nach Provider aufgeteilte
    Docker-Live-Modellmatrix.
  - Starten Sie für gezielte CI-Wiederholungen `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie zu `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten bzw. Release-Aufrufern hinzu.
- Nativer Codex-Smoke-Test für gebundene Chats: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane über den Codex-App-Server-Pfad aus, bindet eine
    synthetische Slack-Direktnachricht mit `/codex bind`, testet `/codex fast` und
    `/codex permissions` und überprüft anschließend, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP weitergeleitet werden.
- Smoke-Test für den Codex-App-Server-Testrahmen: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Durchläufe über den Plugin-eigenen Codex-App-Server-
    Testrahmen aus, überprüft `/codex status` und `/codex models` und testet standardmäßig
    Bild-, Cron-MCP-, Sub-Agent- und Guardian-Prüfungen. Deaktivieren Sie die
    Sub-Agent-Prüfung mit `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie
    andere Fehler isolieren. Deaktivieren Sie für eine gezielte Sub-Agent-Prüfung die
    anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Die Ausführung wird nach der Sub-Agent-Prüfung beendet, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht gesetzt ist.
- Codex-Smoke-Test für bedarfsgesteuerte Installation: `pnpm test:docker:codex-on-demand`
  - Installiert das paketierte OpenClaw-Tarball in Docker, führt das Onboarding mit einem OpenAI-API-Schlüssel
    aus und überprüft, dass das Codex-Plugin sowie die Abhängigkeit `@openai/codex`
    bei Bedarf in das verwaltete npm-Projektstammverzeichnis heruntergeladen wurden.
- Live-Smoke-Test für Abhängigkeiten von Plugin-Tools: `pnpm test:docker:live-plugin-tool`
  - Paketiert ein Fixture-Plugin mit einer echten `slugify`-Abhängigkeit, installiert es
    über `npm-pack:`, überprüft die Abhängigkeit im verwalteten npm-
    Projektstammverzeichnis und fordert anschließend ein echtes OpenAI-Modell auf, das Plugin-Tool aufzurufen und
    den verborgenen Slug zurückzugeben.
- Smoke-Test für den Crestodian-Rettungsbefehl: `pnpm test:live:crestodian-rescue-channel`
  - Optionale zusätzliche Sicherheitsprüfung für die Oberfläche des Rettungsbefehls im Nachrichtenkanal.
    Führt `/crestodian status` aus, reiht eine dauerhafte Modelländerung ein,
    antwortet mit `/crestodian yes` und überprüft den Schreibpfad für Audit und Konfiguration.
- Docker-Smoke-Test für den ersten Crestodian-Start: `pnpm test:docker:crestodian-first-run`
  - Beginnt mit einem leeren OpenClaw-Zustandsverzeichnis und weist zunächst nach, dass die paketierte
    CLI `openclaw crestodian` ohne Inferenz sicher fehlschlägt. Anschließend wird
    Fake Claude über das paketierte Aktivierungsmodul getestet und aktiviert.
    Erst danach erreicht eine unscharfe paketierte CLI-Anfrage den Planer und
    wird in eine typisierte Einrichtung aufgelöst, gefolgt von einmaligen Vorgängen für Modell, Agent, Discord-Plugin
    und SecretRef. Dabei werden Konfigurations- und Audit-Einträge validiert. Dies sind
    unterstützende Nachweise für Prüfungen und Vorgänge, keine Nachweise für interaktives Onboarding oder
    Crestodian-Agenten, -Tools bzw. -Genehmigungen. Dieselbe Lane ist in QA Lab über
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` verfügbar.
- Moonshot-/Kimi-Kosten-Smoke-Test: Führen Sie bei gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` und anschließend einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  mit `moonshot/kimi-k2.6` aus. Überprüfen Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistententranskript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, grenzen Sie die Live-Tests vorzugsweise über die unten beschriebenen Allowlist-Umgebungsvariablen ein.
</Tip>

## QA-spezifische Runner

Diese Befehle ergänzen die Haupttestreihen, wenn Sie die Realitätsnähe von QA Lab benötigen.

Die CI führt QA Lab in dedizierten Workflows aus. Agentische Parität ist unter
`QA-Lab - All Lanes` und der Release-Validierung eingebettet und kein eigenständiger PR-Workflow.
Für eine umfassende Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Prüfungen verwendet werden. Stabile/standardmäßige Release-
Prüfungen behalten umfassende Live-/Docker-Dauertests hinter `run_release_soak=true`; das
Profil `full` aktiviert die Dauertests zwingend. `QA-Lab - All Lanes` wird jede Nacht auf `main` sowie
bei manueller Auslösung mit der Mock-Paritäts-Lane, der Live-Matrix-Lane,
der von Convex verwalteten Live-Telegram-Lane und der von Convex verwalteten Live-Discord-Lane als
parallele Jobs ausgeführt. Geplante QA- und Release-Prüfungen übergeben für Matrix ausdrücklich `--profile fast`,
während die Standardeinstellung der Matrix-CLI und der manuellen Workflow-Eingabe weiterhin
`all` ist; bei manueller Auslösung kann `all` in die Jobs `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` und `e2ee-cli` aufgeteilt werden. `OpenClaw Release Checks` führt
vor der Release-Freigabe die Paritätsprüfung sowie die schnellen Matrix- und Telegram-Lanes aus und verwendet
`mock-openai/gpt-5.6-luna` für die Release-Transportprüfungen, damit sie deterministisch bleiben
und den normalen Start des Provider-Plugins vermeiden. Diese Live-Transport-Gateways
deaktivieren die Speichersuche; das Speicherverhalten bleibt durch die QA-Paritätstestreihen abgedeckt.

Die Live-Medien-Shards der vollständigen Release-Prüfung verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
Image `ghcr.io/openclaw/openclaw-live-test:<sha>`, das einmal pro ausgewähltem
Commit erstellt und anschließend mit `OPENCLAW_SKIP_DOCKER_BUILD=1` abgerufen wird, statt
es in jedem Shard neu zu erstellen.

- `pnpm openclaw qa suite`
  - Führt Repository-gestützte QA-Szenarien direkt auf dem Host aus.
  - Schreibt die übergeordneten Artefakte `qa-evidence.json`, `qa-suite-summary.json` und
    `qa-suite-report.md` für die ausgewählte Szenariengruppe, einschließlich
    einer gemischten Auswahl aus Flow-, Vitest- und Playwright-Szenarien.
  - Bei Ausführung durch `pnpm openclaw qa run --qa-profile <profile>` wird
    die Scorecard des ausgewählten Taxonomieprofils in dieselbe `qa-evidence.json`
    eingebettet. `smoke-ci` schreibt reduzierte Nachweise (`evidenceMode: "slim"`, keine
    `execution` pro Eintrag). `release` deckt den kuratierten Ausschnitt zur Release-Bereitschaft ab; `all`
    wählt jede aktive Reifekategorie aus und ist für explizite Workflow-Ausführungen von QA Profile
    Evidence vorgesehen, wenn ein vollständiges Scorecard-Artefakt benötigt wird.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig eine Parallelität von 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker
    anzupassen, oder `--concurrency 1` für den älteren seriellen Ausführungspfad.
  - Wird mit einem von null verschiedenen Status beendet, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures` für
    Artefakte ohne fehlerhaften Exit-Code.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen, AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne den szenariobewussten
    `mock-openai`-Ausführungspfad zu ersetzen.
- `pnpm openclaw qa coverage --match <query>`
  - Durchsucht Szenario-IDs, Titel, Oberflächen, Abdeckungs-IDs, Dokumentationsreferenzen, Code-
    Referenzen, Plugins und Provider-Anforderungen und gibt anschließend passende Suite-
    Ziele aus.
  - Verwenden Sie dies vor einer QA-Lab-Ausführung, wenn Sie das betroffene Verhalten oder den Dateipfad
    kennen, aber nicht das kleinste Szenario. Nur als Empfehlung – wählen Sie weiterhin Mock-,
    Live-, Multipass-, Matrix- oder Transportnachweise entsprechend dem geänderten
    Verhalten aus.
- `pnpm test:plugins:kitchen-sink-live`
  - Führt den Live-OpenAI-Kitchen-Sink-Plugin-Testparcours über QA Lab aus.
    Installiert das externe Kitchen-Sink-Paket, überprüft das Oberflächeninventar des Plugin SDK,
    prüft `/healthz` und `/readyz`, zeichnet Gateway-
    CPU-/RSS-Nachweise auf, führt einen Live-OpenAI-Durchlauf aus und prüft adversariale
    Diagnosen. Erfordert eine Live-OpenAI-Authentifizierung wie `OPENAI_API_KEY`. In
    vorbereiteten Testbox-Sitzungen wird automatisch das Live-Authentifizierungsprofil der Testbox geladen,
    wenn der Helfer `openclaw-testbox-env` vorhanden ist.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Benchmark für den Gateway-Start sowie ein kleines Paket aus Mock-QA-Lab-Szenarien aus
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) und schreibt eine kombinierte Zusammenfassung der CPU-Beobachtungen
    unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltende Beobachtungen hoher CPU-Auslastung (`--cpu-core-warn`,
    Standardwert `0.9`; `--hot-wall-warn-ms`, Standardwert `30000`), sodass kurze Lastspitzen beim Start
    als Metriken aufgezeichnet werden, ohne wie die minutenlange
    Regression mit dauerhaft ausgelastetem Gateway zu wirken.
  - Wird mit gebauten `dist`-Artefakten ausgeführt; führen Sie zuerst einen Build aus, wenn der Checkout
    noch keine aktuellen Laufzeitausgaben enthält.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer temporären Multipass-Linux-VM aus und behält
    dieselben Flags zur Szenario-, Provider- und Modellauswahl wie `qa suite` bei.
  - Bei Live-Ausführungen werden die für den Gast nutzbaren QA-Authentifizierungseingaben weitergeleitet:
    umgebungsbasierte Provider-Schlüssel, der Pfad zur Konfiguration des QA-Live-Providers und
    `CODEX_HOME`, sofern vorhanden.
  - Ausgabeverzeichnisse müssen unterhalb des Repository-Stammverzeichnisses bleiben, damit der Gast
    über den eingebundenen Arbeitsbereich zurückschreiben kann.
  - Schreibt den normalen QA-Bericht und die Zusammenfassung sowie Multipass-Protokolle unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für QA-Arbeiten im Betriebsstil.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Erstellt einen npm-Tarball aus dem aktuellen Checkout, installiert ihn global in
    Docker, führt ein nicht interaktives Onboarding mit OpenAI-API-Schlüssel aus, konfiguriert
    standardmäßig Telegram, überprüft, dass die paketierte Plugin-Laufzeit ohne
    Reparatur der Startabhängigkeiten geladen wird, führt doctor aus und führt einen lokalen Agenten-Durchlauf
    gegen einen simulierten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um denselben Ausführungspfad für die paketierte Installation
    mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Docker-Smoke-Test der gebauten App für eingebettete Laufzeitkontext-
    Transkripte aus. Überprüft, dass der verborgene OpenClaw-Laufzeitkontext als
    nicht angezeigte benutzerdefinierte Nachricht erhalten bleibt, anstatt in den sichtbaren Benutzer-
    Durchlauf einzufließen, speist anschließend eine betroffene defekte Sitzungs-JSONL ein und überprüft,
    dass `openclaw doctor --fix` sie mit einer Sicherung auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt das Onboarding des installierten Pakets
    aus, konfiguriert Telegram über die installierte CLI und verwendet anschließend
    den Live-Telegram-QA-Ausführungspfad erneut, wobei dieses installierte Paket als zu testendes System des
    Gateway dient.
  - Der Wrapper bindet nur den Quellcode des `qa-lab`-Testsystems aus dem Checkout ein;
    das installierte Paket ist für `dist`, `openclaw/plugin-sdk` und die gebündelte
    Plugin-Laufzeit zuständig, sodass der Ausführungspfad keine Plugins aus dem aktuellen Checkout
    in das zu testende Paket mischt.
  - Verwendet standardmäßig `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen einen aufgelösten lokalen Tarball zu testen,
    anstatt ihn aus der Registry zu installieren.
  - Gibt standardmäßig wiederholte RTT-Zeitmessungen in `qa-evidence.json` mit
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` aus. Überschreiben Sie
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` oder
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, um die Ausführung anzupassen.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` akzeptiert eine kommagetrennte Liste von
    Telegram-QA-Prüf-IDs für die Stichprobe; wenn nicht gesetzt, ist die standardmäßige RTT-fähige
    Prüfung `telegram-mentioned-message-reply`.
  - Verwendet dieselben Telegram-Umgebungszugangsdaten oder dieselbe Convex-Zugangsdatenquelle wie
    `pnpm openclaw qa telegram`. Setzen Sie für CI-/Release-Automatisierung
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` sowie
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Rollengeheimnis. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollengeheimnis in
    CI vorhanden sind, wählt der Docker-Wrapper Convex automatisch aus.
  - Der Wrapper validiert die Umgebungsvariablen für Telegram- oder Convex-Zugangsdaten auf dem Host,
    bevor Docker-Build-/Installationsarbeiten beginnen. Setzen Sie
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` nur, wenn Sie
    bewusst die Einrichtung vor Bereitstellung der Zugangsdaten debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die
    gemeinsame Variable `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diesen Ausführungspfad. Wenn Convex-
    Zugangsdaten ausgewählt sind und keine Rolle festgelegt ist, verwendet der Wrapper in CI `ci`
    und außerhalb von CI `maintainer`.
  - GitHub Actions stellt diesen Ausführungspfad als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er wird bei einem Merge nicht ausgeführt. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Zugangsdaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für separat ausgeführte Produktnachweise
  gegen ein einzelnes Kandidatenpaket bereit. Es akzeptiert eine Git-Referenz, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL plus SHA-256, eine Richtlinie für vertrauenswürdige URLs oder ein Tarball-Artefakt
  aus einer anderen Ausführung (`source=ref|npm|url|trusted-url|artifact`), lädt den
  normalisierten `openclaw-current.tgz` als `package-under-test` hoch und führt anschließend den
  vorhandenen Docker-E2E-Scheduler mit den Ausführungsprofilen `smoke`, `package`, `product`, `full`
  oder `custom` aus. Setzen Sie `telegram_mode=mock-openai` oder
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

- Der Nachweis mit exakter Tarball-URL erfordert einen Digest und verwendet die Sicherheitsrichtlinie für öffentliche URLs:

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

`source=trusted-url` liest `.github/package-trusted-sources.json` aus der vertrauenswürdigen Workflow-Referenz und akzeptiert weder URL-Zugangsdaten noch eine Umgehung des privaten Netzwerks über eine Workflow-Eingabe. Wenn die benannte Richtlinie Bearer-Authentifizierung deklariert, konfigurieren Sie das feste Geheimnis `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Der Artefaktnachweis lädt ein Tarball-Artefakt aus einer anderen Actions-Ausführung herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das
    Gateway mit konfiguriertem OpenAI und aktiviert anschließend gebündelte Kanäle/Plugins über
    Konfigurationsänderungen.
  - Überprüft, dass die Einrichtungserkennung nicht konfigurierte herunterladbare Plugins
    nicht einbezieht, die erste konfigurierte doctor-Reparatur jedes fehlende
    herunterladbare Plugin explizit installiert und ein zweiter Neustart keine
    verborgene Abhängigkeitsreparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Ausgangsversion, aktiviert Telegram vor
    der Ausführung von `openclaw update --tag <candidate>` und überprüft, dass doctor nach dem Update
    beim Kandidaten Altlasten aus früheren Plugin-Abhängigkeiten entfernt,
    ohne eine durch das Testsystem ausgeführte Postinstall-Reparatur.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Smoke-Test für Aktualisierungen paketierter Installationen auf Parallels-Gastsystemen aus.
    Jede ausgewählte Plattform installiert zuerst das angeforderte Ausgangspaket,
    führt anschließend den installierten Befehl `openclaw update` im selben Gastsystem aus und
    überprüft die installierte Version, den Aktualisierungsstatus, die Gateway-Bereitschaft und
    einen lokalen Agenten-Durchlauf.
  - Verwenden Sie bei der Arbeit mit einem einzelnen Gastsystem `--platform macos`, `--platform windows` oder `--platform linux`.
    Verwenden Sie `--json` für den Pfad zum Zusammenfassungsartefakt
    und den Status pro Ausführungspfad.
  - Der OpenAI-Ausführungspfad verwendet standardmäßig `openai/gpt-5.6-luna` für den Nachweis des Live-Agenten-Durchlaufs.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, um ein anderes OpenAI-Modell zu validieren.
  - Umschließen Sie lange lokale Ausführungen mit einem Host-Timeout, damit Blockierungen beim Parallels-Transport
    nicht das restliche Testzeitfenster aufbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Ausführungsprotokolle unter
    `/tmp/openclaw-parallels-npm-update.*`. Prüfen Sie `windows-update.log`,
    `macos-update.log` oder `linux-update.log`, bevor Sie davon ausgehen, dass der äußere
    Wrapper hängt.
  - Die Windows-Aktualisierung kann auf einem kalten Gastsystem 10 bis 15 Minuten für doctor nach der Aktualisierung und
    die Paketaktualisierung benötigen; dies ist weiterhin ein ordnungsgemäßer Ablauf, solange das
    verschachtelte npm-Debug-Protokoll fortgeschrieben wird.
  - Führen Sie diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-
    Smoke-Ausführungspfaden für macOS, Windows oder Linux aus. Sie teilen sich den VM-Zustand und können
    bei der Snapshot-Wiederherstellung, Paketbereitstellung oder beim Gateway-Zustand des Gastsystems
    kollidieren.
  - Der Nachweis nach der Aktualisierung führt die normale gebündelte Plugin-Oberfläche aus, da
    Fähigkeitsfassaden wie Sprachausgabe, Bilderzeugung und Medienverständnis
    über gebündelte Laufzeit-APIs geladen werden, selbst wenn der Agenten-Durchlauf
    selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte
    Protokoll-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt den Matrix-Live-QA-Testlauf gegen einen temporären, Docker-gestützten
    Tuwunel-Homeserver aus. Nur im Quellcode-Checkout verfügbar – paketierte
    Installationen enthalten `qa-lab` nicht.
  - Vollständige CLI, Profil-/Szenariokatalog, Umgebungsvariablen und Artefaktstruktur:
    [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt den Telegram-Live-QA-Testlauf gegen eine echte private Gruppe aus und
    verwendet dafür die Treiber- und SUT-Bot-Tokens aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische
    Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte
    Zugangsdaten aus einem Pool. Verwenden Sie standardmäßig den Umgebungsmodus
    oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um Pool-Leases zu
    verwenden.
  - Die Standardabdeckung umfasst Canary, Erwähnungs-Gating, Befehlsadressierung,
    `/status`, erwähnte Bot-zu-Bot-Antworten und Antworten auf native Kernbefehle.
    Die Standardwerte von `mock-openai` decken außerdem deterministische
    Antwortketten und Regressionen beim Streaming der abschließenden
    Telegram-Nachricht ab. Verwenden Sie `--list-scenarios` für optionale
    Prüfungen wie `session_status`.
  - Wird mit einem Exit-Code ungleich null beendet, wenn ein Szenario fehlschlägt.
    Verwenden Sie `--allow-failures`, um Artefakte ohne fehlerhaften Exit-Code
    zu erhalten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei
    der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Aktivieren Sie für eine stabile Bot-zu-Bot-Beobachtung den
    Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen
    Sie sicher, dass der Treiber-Bot den Bot-Datenverkehr der Gruppe beobachten
    kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und
    `qa-evidence.json` unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten
    die RTT von der Sendeanfrage des Treibers bis zur beobachteten SUT-Antwort.

`Mantis Telegram Live` ist der PR-Nachweis-Wrapper für diesen Testlauf. Er führt
den Kandidaten-Ref mit über Convex geleasten Telegram-Zugangsdaten aus, rendert
das redigierte QA-Berichts-/Nachweispaket in einem Crabbox-Desktop-Browser,
zeichnet einen MP4-Nachweis auf, erzeugt ein auf Bewegungen zugeschnittenes GIF,
lädt das Artefaktpaket hoch und veröffentlicht über die Mantis GitHub App einen
Inline-PR-Nachweis, wenn `pr_number` gesetzt ist. Maintainer können ihn über
`Mantis Scenario` (`scenario_id: telegram-live`) in der Actions-Benutzeroberfläche
oder direkt über einen Pull-Request-Kommentar starten:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` ist der agentische Wrapper für einen
Vorher-/Nachher-Nachweis in der nativen Telegram-Desktop-Anwendung für visuelle
PR-Nachweise. Starten Sie ihn in der Actions-Benutzeroberfläche mit frei
formulierten `instructions`, über `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) oder über einen PR-Kommentar:

```text
@openclaw-mantis telegram desktop proof
```

Der Mantis-Agent liest den PR, entscheidet, welches in Telegram sichtbare
Verhalten die Änderung belegt, führt den Crabbox-Telegram-Desktop-Nachweistestlauf
mit einem echten Benutzer für Basis- und Kandidaten-Refs aus, iteriert, bis die
nativen GIFs aussagekräftig sind, schreibt ein gepaartes `motionPreview`-Manifest
und veröffentlicht über die Mantis GitHub App dieselbe zweispaltige GIF-Tabelle,
wenn `pr_number` gesetzt ist.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Least einen Crabbox-Linux-Desktop oder verwendet ihn erneut, installiert
    die native Telegram-Desktop-Anwendung, konfiguriert OpenClaw mit einem
    geleasten Telegram-SUT-Bot-Token, startet das Gateway und zeichnet
    Screenshot-/MP4-Nachweise vom sichtbaren VNC-Desktop auf.
  - Verwendet standardmäßig `--credential-source convex`, sodass Workflows nur
    das Convex-Broker-Secret benötigen. Verwenden Sie
    `--credential-source env` mit denselben `OPENCLAW_QA_TELEGRAM_*`-Variablen
    wie bei `pnpm openclaw qa telegram`.
  - Telegram Desktop benötigt weiterhin eine Benutzeranmeldung bzw. ein
    Benutzerprofil. Das Bot-Token konfiguriert nur OpenClaw. Verwenden Sie
    `--telegram-profile-archive-env <name>` für ein Base64-kodiertes
    `.tgz`-Profilarchiv oder verwenden Sie `--keep-lease` und melden Sie sich
    einmal manuell über VNC an.
  - Schreibt `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` und `telegram-desktop-builder.mp4`
    unterhalb des Ausgabeverzeichnisses.

Live-Transport-Testläufe verwenden einen gemeinsamen Standardvertrag, damit
neue Transporte nicht voneinander abweichen; die Abdeckungsmatrix je Testlauf
finden Sie unter
[QA-Übersicht – Live-Transportabdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` ist die umfassende synthetische Suite und nicht Teil dieser Matrix.

### Gemeinsam genutzte Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
für Live-Transport-QA aktiviert ist, bezieht das QA-Labor eine exklusive Lease
aus einem Convex-gestützten Pool, sendet während der Ausführung des Testlaufs
Heartbeats für diese Lease und gibt sie beim Herunterfahren frei. Der
Abschnittsname stammt aus der Zeit vor der Unterstützung von Discord, Slack und
WhatsApp; der Lease-Vertrag gilt für alle Arten gemeinsam.

Referenzgerüst für das Convex-Projekt: `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Zugangsdatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Umgebungsstandard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI,
    andernfalls `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standardwert `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standardwert `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standardwert `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standardwert `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standardwert `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Ablaufverfolgungs-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs
  ausschließlich für die lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Adminbefehle (Pool hinzufügen/entfernen/auflisten) erfordern
ausdrücklich `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsbefehle für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Ausführungen, um die Convex-Site-URL,
Broker-Secrets, das Endpunktpräfix, das HTTP-Zeitlimit und die Erreichbarkeit
von Admin-/Listenfunktionen zu prüfen, ohne Secret-Werte auszugeben. Verwenden
Sie `--json` für maschinenlesbare Ausgaben in Skripten und CI-Hilfsprogrammen.

Standardmäßiger Endpunktvertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Anfragen authentifizieren sich mit einem `Authorization: Bearer <role secret>`-Header;
in den folgenden Bodys ist dieser Header ausgelassen:

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Erfolg: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Erfolg: `{ status: "ok" }` (oder leere `2xx`-Antwort)
- `POST /release`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Erfolg: `{ status: "ok" }` (oder leere `2xx`-Antwort)
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

Payload-Struktur für die Art Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine Zeichenfolge mit einer numerischen Telegram-Chat-ID sein.
- `admin/add` validiert diese Struktur für `kind: "telegram"` und lehnt
  fehlerhafte Payloads ab.

Payload-Struktur für die Art „echter Telegram-Benutzer“:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` und `telegramApiId` müssen numerische Zeichenfolgen sein.
- `tdlibArchiveSha256` und `desktopTdataArchiveSha256` müssen SHA-256-Hex-Zeichenfolgen sein.
- `kind: "telegram-user"` ist für den Mantis-Telegram-Desktop-Nachweis-Workflow
  reserviert. Generische QA-Labor-Testläufe dürfen diese Art nicht beziehen.

Vom Broker validierte Mehrkanal-Payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack-Testläufe können ebenfalls Zugangsdaten aus dem Pool leasen, die
Slack-Payload-Validierung befindet sich derzeit jedoch im Slack-QA-Runner und
nicht im Broker. Verwenden Sie
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
für Slack-Zeilen.

### Hinzufügen eines Kanals zur QA

Die Architektur und Namen der Szenario-Hilfsfunktionen für neue Kanaladapter
finden Sie unter
[QA-Übersicht – Hinzufügen eines Kanals](/de/concepts/qa-e2e-automation#adding-a-channel).
Mindestanforderungen: Implementieren Sie den Transport-Runner an der gemeinsamen
`qa-lab`-Host-Schnittstelle, fügen Sie eine `adapterFactory` für gemeinsame
Szenarien hinzu, deklarieren Sie `qaRunners` im Plugin-Manifest, binden Sie ihn
als `openclaw qa <runner>` ein und erstellen Sie Szenarien unter
`qa/scenarios/`.

## Testsuiten (was wo ausgeführt wird)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (sowie zunehmende
Fehleranfälligkeit/Kosten).

### Unit-/Integrationstests (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht gezielte Ausführungen verwenden den Shard-Satz
  `vitest.full-*.config.ts` und können Shards mit mehreren Projekten für die
  parallele Planung in Konfigurationen je Projekt aufteilen
- Dateien: Kern-/Unit-Testbestände unter `src/**/*.test.ts`,
  `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests werden im
  dedizierten `unit-ui`-Shard ausgeführt
- Umfang:
  - Reine Unit-Tests
  - Prozessinterne Integrationstests (Gateway-Authentifizierung, Routing,
    Werkzeuge, Parsing, Konfiguration)
  - Deterministische Regressionstests für bekannte Fehler
- Erwartungen:
  - Werden in CI ausgeführt
  - Keine echten Schlüssel erforderlich
  - Sollten schnell und stabil sein
  - Resolver- und Loader-Tests für öffentliche Oberflächen müssen das
    umfassende Fallback-Verhalten von `api.js` und `runtime-api.js` mit
    generierten kleinen Plugin-Fixtures nachweisen, nicht mit echten APIs aus
    dem Quellcode gebündelter Plugins. Das Laden echter Plugin-APIs gehört in
    Plugin-eigene Vertrags-/Integrationssuiten.

Richtlinie für native Abhängigkeiten:

- Standardmäßige Testinstallationen überspringen optionale native
  Discord-Opus-Builds. Discord Voice verwendet das gebündelte `libopus-wasm`,
  und `@discordjs/opus` bleibt in `allowBuilds` deaktiviert, damit lokale Tests
  und Testbox-Testläufe das native Add-on nicht kompilieren.
- Vergleichen Sie die native Opus-Leistung im Benchmark-Repository von
  `libopus-wasm`, nicht in den standardmäßigen Installations-/Testschleifen von
  OpenClaw. Setzen Sie `@discordjs/opus` im standardmäßigen `allowBuilds` nicht
  auf `true`; dadurch würden nicht zusammenhängende Installations-/Testschleifen
  nativen Code kompilieren.

<AccordionGroup>
  <Accordion title="Projekte, Shards und begrenzte Testläufe">

    - Ein ungezielter Lauf von `pnpm test` führt dreizehn kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) anstelle eines einzigen riesigen nativen Root-Projekt-Prozesses aus. Dies reduziert den maximalen RSS auf ausgelasteten Rechnern und verhindert, dass auto-reply-/Plugin-Arbeit nicht zusammenhängenden Testsuiten Ressourcen entzieht.
    - `pnpm test --watch` verwendet weiterhin den nativen Projektgraphen aus `vitest.config.ts` im Root-Verzeichnis, da eine Watch-Schleife mit mehreren Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsspezifische Lanes, sodass bei `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollständigen Startkosten des Root-Projekts anfallen.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu kostengünstigen bereichsspezifischen Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Quellzuordnungen und abhängige Elemente im lokalen Importgraphen. Änderungen an Konfiguration, Einrichtung oder Paketen führen Tests nicht umfassend aus, sofern Sie nicht ausdrücklich `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` verwenden.
    - `pnpm check:changed` ist das normale intelligente lokale Prüf-Gate für eng begrenzte Arbeiten. Es klassifiziert den Diff in Core, Core-Tests, Erweiterungen, Erweiterungstests, Apps, Dokumentation, Release-Metadaten, Live-Docker-Werkzeuge und Tooling und führt anschließend die passenden Befehle für Typprüfung, Linting und Schutzprüfungen aus. Es führt keine Vitest-Tests aus; verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis. Versionsanhebungen, die ausschließlich Release-Metadaten betreffen, führen gezielte Prüfungen von Versionen, Konfigurationen und Root-Abhängigkeiten aus; eine Schutzprüfung weist dabei Paketänderungen außerhalb des obersten Versionsfelds zurück.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Prüfungen aus: Shell-Syntaxprüfungen für die Live-Docker-Authentifizierungsskripte und einen Probelauf des Live-Docker-Schedulers. Änderungen an `package.json` werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Änderungen an Abhängigkeiten, Exporten, Versionen und anderen Paketoberflächen verwenden weiterhin die umfassenderen Schutzprüfungen.
    - Importarme Unit-Tests aus Agents, Befehlen, Plugins, auto-reply-Hilfsfunktionen, `plugin-sdk` und ähnlichen Bereichen mit reinen Hilfsfunktionen werden durch die Lane `unit-fast` geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete bzw. laufzeitintensive Dateien verbleiben in den vorhandenen Lanes.
    - Ausgewählte Quelldateien mit Hilfsfunktionen aus `plugin-sdk` und `commands` ordnen Läufe im Änderungsmodus außerdem expliziten benachbarten Tests in diesen leichtgewichtigen Lanes zu, sodass Änderungen an Hilfsfunktionen nicht erneut die vollständige aufwendige Testsuite für das Verzeichnis ausführen.
    - `auto-reply` verfügt über eigene Gruppen für Core-Hilfsfunktionen der obersten Ebene, `reply.*`-Integrationstests der obersten Ebene und den Teilbaum `src/auto-reply/reply/**`. CI unterteilt den reply-Teilbaum zusätzlich in Shards für agent-runner, dispatch sowie commands/state-routing, damit nicht eine einzige importintensive Gruppe für den gesamten Node-Ausläufer verantwortlich ist.
    - Die normale PR-/main-CI überspringt bewusst den gebündelten Plugin-Batch-Durchlauf und den ausschließlich für Releases vorgesehenen Shard `agentic-plugins`. Full Release Validation startet für diese Plugin-intensiven Testsuiten auf Release-Kandidaten den separaten untergeordneten Workflow `Plugin Prerelease`.

  </Accordion>

  <Accordion title="Testabdeckung des eingebetteten Runners">

    - Wenn Sie Eingaben für die Erkennung von Nachrichtenwerkzeugen oder den Laufzeitkontext der Compaction ändern, behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Regressionstests für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halten Sie die Integrationstestsuiten des eingebetteten Runners funktionsfähig:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` und
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Testsuiten überprüfen, dass bereichsspezifische IDs und das Compaction-Verhalten weiterhin die realen Pfade `run.ts` / `compact.ts` durchlaufen; reine Tests von Hilfsfunktionen sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Standardeinstellungen für Vitest-Pool und -Isolation">

    - Die Vitest-Basiskonfiguration verwendet standardmäßig `threads`.
    - Die gemeinsam genutzte Vitest-Konfiguration legt `isolate: false` fest und verwendet den nicht isolierten Runner für die Root-Projekte sowie die E2E- und Live-Konfigurationen.
    - Die UI-Lane des Root-Projekts behält ihre `jsdom`-Einrichtung und ihren Optimierer bei, wird jedoch ebenfalls mit dem gemeinsam genutzten nicht isolierten Runner ausgeführt.
    - Jeder `pnpm test`-Shard übernimmt dieselben Standardeinstellungen `threads` + `isolate: false` aus der gemeinsam genutzten Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt untergeordneten Vitest-Node-Prozessen standardmäßig `--no-maglev` hinzu, um den V8-Kompilierungsaufwand bei großen lokalen Läufen zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um einen Vergleich mit dem standardmäßigen V8-Verhalten durchzuführen.
    - `scripts/run-vitest.mjs` beendet explizite Vitest-Läufe außerhalb des Watch-Modus, wenn 5 Minuten lang keine Ausgabe auf stdout oder stderr erfolgt. Setzen Sie `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, um den Watchdog für eine absichtlich ausgabefreie Untersuchung zu deaktivieren.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook führt ausschließlich Formatierung durch. Er nimmt formatierte Dateien erneut in den Staging-Bereich auf und führt weder Linting noch Typprüfung oder Tests aus.
    - Führen Sie `pnpm check:changed` vor der Übergabe oder dem Push explizit aus, wenn Sie das intelligente lokale Prüf-Gate benötigen.
    - `pnpm test:changed` verwendet standardmäßig kostengünstige bereichsspezifische Lanes. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent entscheidet, dass eine Änderung am Harness, an der Konfiguration, am Paket oder am Vertrag tatsächlich eine umfassendere Vitest-Abdeckung erfordert.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, lediglich mit einer höheren Obergrenze für Worker.
    - Die automatische Skalierung lokaler Worker ist bewusst konservativ und reduziert die Auslastung, wenn der durchschnittliche Host-Load bereits hoch ist, sodass mehrere gleichzeitig ausgeführte Vitest-Läufe standardmäßig weniger Beeinträchtigungen verursachen.
    - Die Vitest-Basiskonfiguration kennzeichnet die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Wiederholungsläufe im Änderungsmodus korrekt bleiben, wenn sich die Testverdrahtung ändert.
    - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, um für direktes Profiling einen expliziten Cache-Speicherort festzulegen.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert die Vitest-Berichterstattung zur Importdauer sowie eine Aufschlüsselung der Importe.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
    - Shard-Zeitdaten werden in `.artifacts/vitest-shard-timings.json` geschrieben. Läufe der gesamten Konfiguration verwenden den Konfigurationspfad als Schlüssel; CI-Shards mit Include-Mustern hängen den Shard-Namen an, sodass gefilterte Shards separat verfolgt werden können.
    - Wenn ein besonders zeitintensiver Test weiterhin den Großteil seiner Zeit mit Startimporten verbringt, halten Sie umfangreiche Abhängigkeiten hinter einer schmalen lokalen `*.runtime.ts`-Schnittstelle und mocken Sie diese Schnittstelle direkt, anstatt Laufzeit-Hilfsfunktionen per Deep Import lediglich zu importieren, um sie an `vi.mock(...)` weiterzureichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete `test:changed` für diesen eingecheckten Diff mit dem nativen Root-Projekt-Pfad und gibt die verstrichene Gesamtzeit sowie den maximalen RSS unter macOS aus.
    - `pnpm test:perf:changed:bench -- --worktree` führt einen Benchmark des aktuellen Arbeitsverzeichnisses mit nicht eingecheckten Änderungen durch, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geleitet wird.
    - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Hauptthreads für den Startaufwand von Vitest/Vite und Transformationen.
    - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die Unit-Testsuite bei deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` und `test/vitest/vitest.infra.config.ts`, jeweils auf einen Worker beschränkt
- Umfang:
  - Startet einen echten Loopback-Gateway, bei dem die Diagnose standardmäßig aktiviert ist
  - Leitet synthetische Gateway-Nachrichten-, Speicher- und Nutzlastwechsel mit großen Datenmengen durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über den Gateway-WS-RPC ab
  - Deckt Hilfsfunktionen zur Persistierung des Diagnose-Stabilitätspakets ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Messwerte unter dem Belastungsbudget bleiben und sich die Warteschlangentiefen pro Sitzung wieder auf null reduzieren
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Eng begrenzte Lane zur Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Testsuite

### E2E (Repo-Aggregat)

- Befehl: `pnpm test:e2e`
- Umfang:
  - Führt die Gateway-Smoke-E2E-Lane aus
  - Führt die Browser-E2E-Lane mit gemockter Control UI aus
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Playwright Chromium muss installiert sein

### E2E (Gateway-Smoke-Test)

- Befehl: `pnpm test:e2e:gateway`
- Konfiguration: `test/vitest/vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeitstandards:
  - Verwendet Vitest-`threads` mit `isolate: false`, entsprechend dem Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Wird standardmäßig im stillen Modus ausgeführt, um den Aufwand für Konsolen-E/A zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um die ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateway mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Kopplung und umfangreichere Netzwerkkommunikation
- Erwartungen:
  - Wird in CI ausgeführt (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als bei Unit-Tests (kann langsamer sein)

### E2E (gemockter Control-UI-Browser)

- Befehl: `pnpm test:ui:e2e`
- Konfiguration: `test/vitest/vitest.ui-e2e.config.ts`
- Dateien: `ui/src/**/*.e2e.test.ts`
- Umfang:
  - Startet die Vite Control UI
  - Steuert über Playwright eine echte Chromium-Seite
  - Ersetzt den Gateway-WebSocket durch deterministische browserinterne Mocks
- Erwartungen:
  - Wird in CI als Teil von `pnpm test:e2e` ausgeführt
  - Kein echter Gateway und keine echten Agents oder Provider-Schlüssel erforderlich
  - Die Browserabhängigkeit muss vorhanden sein (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell-Backend-Smoke-Test

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Verwendet einen aktiven lokalen OpenShell-Gateway erneut
  - Erstellt eine Sandbox aus einer temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über eine echte `sandbox ssh-config`-Konfiguration und SSH-Ausführung
  - Überprüft das remote-kanonische Dateisystemverhalten über die Dateisystem-Bridge der Sandbox
- Erwartungen:
  - Nur auf ausdrückliche Aktivierung; nicht Teil des standardmäßigen Laufs von `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionsfähigen Docker-Daemon
  - Erfordert einen aktiven lokalen OpenShell-Gateway und dessen Konfigurationsquelle
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und löscht anschließend die Test-Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test bei der manuellen Ausführung der umfassenderen E2E-Testsuite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript anzugeben
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, um dem isolierten Test die registrierte Gateway-Konfiguration bereitzustellen
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, um die von der Host-Richtlinien-Fixture verwendete Docker-Gateway-IP zu überschreiben

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `test/vitest/vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Änderungen am Providerformat, Besonderheiten bei Tool-Aufrufen, Authentifizierungsprobleme und das Verhalten bei Ratenbegrenzungen
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Verursacht Kosten / beansprucht Ratenbegrenzungen
  - Führen Sie vorzugsweise eingegrenzte Teilmengen statt „alles“ aus
- Live-Ausführungen verwenden bereits exportierte API-Schlüssel und bereitgestellte Authentifizierungsprofile.
- Standardmäßig isolieren Live-Ausführungen weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Benutzerverzeichnis, damit Unit-Test-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests bewusst Ihr echtes Benutzerverzeichnis verwenden sollen.
- `pnpm test:live` verwendet standardmäßig einen ruhigeren Modus: Die Fortschrittsausgabe `[live] ...` bleibt erhalten, während Gateway-Bootstrap-Protokolle und Bonjour-Meldungen unterdrückt werden. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie wieder die vollständigen Startprotokolle wünschen.
- Rotation von API-Schlüsseln (Provider-spezifisch): Setzen Sie `*_API_KEYS` im kommagetrennten/semikolongetrennten Format oder `*_API_KEY_1`, `*_API_KEY_2` (beispielsweise `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder verwenden Sie pro Live-Ausführung eine Überschreibung über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Antworten aufgrund von Ratenbegrenzungen erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben Fortschrittszeilen auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, selbst wenn die Konsolenerfassung von Vitest keine Ausgabe zeigt.
  - `test/vitest/vitest.live.config.ts` deaktiviert die Konsolenabfangfunktion von Vitest, damit Fortschrittszeilen von Provider und Gateway während Live-Ausführungen sofort ausgegeben werden.
  - Passen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Heartbeats für Gateway/Prüfungen mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Bearbeiten von Logik/Tests: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Änderungen an Gateway-Netzwerk / WS-Protokoll / Kopplung: Führen Sie zusätzlich `pnpm test:e2e` aus
- Debugging von „Mein Bot ist ausgefallen“ / Provider-spezifischen Fehlern / Tool-Aufrufen: Führen Sie ein eingegrenztes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Informationen zur Live-Modellmatrix, zu Smoke-Tests für CLI-Backends, ACP-Smoke-Tests, zum Codex-App-Server-
Test-Harness und zu allen Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI,
Bild, Musik, Video, Medien-Test-Harness) sowie zum Umgang mit Zugangsdaten bei Live-Ausführungen

- finden Sie unter [Live-Suites testen](/de/help/testing-live). Die spezielle Checkliste zur Validierung von Updates und
  Plugins finden Sie unter
  [Updates und Plugins testen](/de/help/testing-updates-plugins).

## Docker-Runner (optionale Prüfungen „funktioniert unter Linux“)

Diese Docker-Runner sind in zwei Gruppen unterteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur die zum jeweiligen Profilschlüssel passende Live-Datei im Docker-Image des Repositorys aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`) und binden dabei Ihr lokales Konfigurationsverzeichnis, den Workspace und eine optionale Profil-Umgebungsdatei ein. Die entsprechenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner behalten bei Bedarf eigene praxisgerechte Obergrenzen bei:
  `test:docker:live-models` verwendet standardmäßig die kuratierte, unterstützte Auswahl mit hoher Aussagekraft und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Setzen Sie `OPENCLAW_LIVE_MAX_MODELS`
  oder die Gateway-Umgebungsvariablen, wenn Sie ausdrücklich eine kleinere Obergrenze oder einen umfangreicheren Scan wünschen.
- `test:docker:all` erstellt das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal über `scripts/package-openclaw-for-docker.mjs` als npm-Tarball und erstellt/verwendet anschließend zwei Images aus `scripts/e2e/Dockerfile`. Das Basis-Image dient nur als Node-/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes binden den vorab erstellten Tarball ein. Das funktionale Image installiert denselben Tarball unter `/app` für Lanes zur Funktionalität der erstellten Anwendung. Die Definitionen der Docker-Lanes befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert die Prozess-Slots, während Ressourcenobergrenzen verhindern, dass ressourcenintensive Live-, npm-Installations- und Mehrdienst-Lanes gleichzeitig starten. Wenn eine einzelne Lane die aktiven Obergrenzen überschreitet, kann der Scheduler sie dennoch starten, wenn der Pool leer ist, und lässt sie anschließend allein laufen, bis wieder Kapazität verfügbar ist. Die Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (und andere Überschreibungen über `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) nur an, wenn der Docker-Host über mehr Kapazitätsreserve verfügt. Der Runner führt standardmäßig eine Docker-Vorabprüfung durch, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aus, speichert die Laufzeiten erfolgreicher Lanes in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Laufzeiten, um bei späteren Ausführungen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest auszugeben, ohne Docker zu erstellen oder auszuführen, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist die GitHub-native Paketprüfung für „Funktioniert dieser installierbare Tarball als Produkt?“. Sie ermittelt ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url`, `source=trusted-url` oder `source=artifact`, lädt es als `package-under-test` hoch und führt anschließend die wiederverwendbaren Docker-E2E-Lanes mit genau diesem Tarball aus, anstatt die ausgewählte Referenz erneut zu packen. Die Profile sind nach Umfang geordnet: `smoke`, `package`, `product` und `full` (sowie `custom` für eine explizite Lane-Liste). Unter [Updates und Plugins testen](/de/help/testing-updates-plugins) finden Sie den Paket-/Update-/Plugin-Vertrag, die Überlebensmatrix für veröffentlichte Upgrades, die Release-Standardwerte und die Fehlertriage.
- Build- und Release-Prüfungen führen nach tsdown `scripts/check-cli-bootstrap-imports.mjs` aus. Die Schutzprüfung durchläuft den statischen erstellten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn dieser Bootstrap-Graph vor der Befehlsweiterleitung statisch ein externes Paket importiert (Commander, Prompt-Benutzeroberfläche, undici, Protokollierung und ähnliche startintensive Abhängigkeiten zählen alle dazu); außerdem begrenzt sie den gebündelten Gateway-Ausführungs-Chunk auf 70 KB und lehnt statische Importe bekannter selten benötigter Gateway-Pfade (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) aus diesem Chunk ab. `scripts/release-check.ts` führt separat Smoke-Tests für die gepackte CLI mit `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` und `models list --provider openai` durch.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert das Test-Harness nur Metadatenlücken in veröffentlichten Paketen: ausgelassene Einträge im privaten QA-Inventar, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien in der aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, veraltete Speicherorte für Plugin-Installationsdatensätze, fehlende Persistierung von Marketplace-Installationsdatensätzen und die Migration von Konfigurationsmetadaten während `plugins update`. Bei Paketen nach `2026.4.25` führen diese Pfade zwingend zu Fehlern.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und überprüfen übergeordnete Integrationspfade.
- Docker-/Bash-E2E-Lanes, die den gepackten OpenClaw-Tarball über `scripts/lib/openclaw-e2e-instance.sh` installieren, begrenzen `npm install` auf `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (Standardwert `600s`; setzen Sie `0`, um den Wrapper zum Debuggen zu deaktivieren).

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Authentifizierungsverzeichnisse ein
(oder alle unterstützten, wenn die Ausführung nicht eingegrenzt ist) und kopieren sie anschließend vor der Ausführung in das
Benutzerverzeichnis des Containers, damit OAuth für externe CLIs Token aktualisieren kann,
ohne den Authentifizierungsspeicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid-/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Test-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungsagent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke-Tests: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` und `pnpm qa:observability:smoke` sind private QA-Lanes für den Quellcode-Checkout. Sie sind absichtlich nicht Teil der Docker-Paket-Release-Lanes, da der npm-Tarball QA Lab nicht enthält.
- Open-WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Gerüst): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Smoke-Test für Onboarding/Kanal/Agent: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert standardmäßig OpenAI über ein Onboarding mit Umgebungsreferenz sowie Telegram, führt doctor aus und führt einen simulierten OpenAI-Agentendurchlauf aus. Verwenden Sie einen vorab erstellten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den erneuten Host-Build mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` oder `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke-Test für die Release-Benutzerreise: `pnpm test:docker:release-user-journey` installiert den gepackten OpenClaw-Tarball global in einem sauberen Docker-Home-Verzeichnis, führt das Onboarding aus, konfiguriert einen simulierten OpenAI-Provider, führt einen Agent-Durchlauf aus, installiert/deinstalliert externe Plugins, konfiguriert ClickClack anhand einer lokalen Test-Fixture, überprüft ausgehende/eingehende Nachrichten, startet den Gateway neu und führt Doctor aus.
- Smoke-Test für das typisierte Release-Onboarding: `pnpm test:docker:release-typed-onboarding` installiert den gepackten Tarball, steuert `openclaw onboard` über ein echtes TTY, konfiguriert OpenAI als Env-Ref-Provider, überprüft, dass kein Rohschlüssel gespeichert wird, und führt einen simulierten Agent-Durchlauf aus.
- Smoke-Test für Release-Medien/-Speicher: `pnpm test:docker:release-media-memory` installiert den gepackten Tarball und überprüft das Bildverständnis anhand eines PNG-Anhangs, die Ausgabe einer OpenAI-kompatiblen Bilderzeugung, den Abruf über die Speichersuche und den Fortbestand des Abrufs nach einem Neustart des Gateway.
- Smoke-Test für die Release-Upgrade-Benutzerreise: `pnpm test:docker:release-upgrade-user-journey` installiert standardmäßig die neueste veröffentlichte Basisversion, die älter als der Kandidaten-Tarball ist, konfiguriert den Provider-/Plugin-/ClickClack-Zustand im veröffentlichten Paket, führt ein Upgrade auf den Kandidaten-Tarball durch und wiederholt anschließend die zentrale Agent-/Plugin-/Kanal-Benutzerreise. Wenn keine ältere veröffentlichte Basisversion vorhanden ist, wird die Kandidatenversion erneut verwendet. Überschreiben Sie die Basisversion mit `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke-Test für den Release-Plugin-Marktplatz: `pnpm test:docker:release-plugin-marketplace` installiert aus einem lokalen Fixture-Marktplatz, aktualisiert das installierte Plugin, deinstalliert es und überprüft, dass die Plugin-CLI verschwindet und die Installationsmetadaten bereinigt werden.
- Smoke-Test für die Skill-Installation: `pnpm test:docker:skill-install` installiert den gepackten OpenClaw-Tarball global in Docker, deaktiviert in der Konfiguration die Installation hochgeladener Archive, ermittelt über die Suche den aktuellen Slug eines live verfügbaren ClawHub-Skills, installiert ihn mit `openclaw skills install` und überprüft den installierten Skill sowie die Herkunfts-/Sperrmetadaten in `.clawhub`.
- Smoke-Test für den Wechsel des Update-Kanals: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt vom Paketkanal `stable` zum Git-Kanal `dev`, überprüft den gespeicherten Kanal und die Funktion des Plugins nach dem Update, wechselt anschließend zurück zum Paketkanal `stable` und prüft den Update-Status.
- Smoke-Test für das Überstehen eines Upgrades: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über einer nicht bereinigten Fixture eines alten Benutzers mit Agents, Kanalkonfiguration, Plugin-Zulassungslisten, veraltetem Plugin-Abhängigkeitszustand sowie vorhandenen Workspace-/Sitzungsdateien. Der Test führt ein Paket-Update sowie Doctor nicht interaktiv und ohne Live-Provider- oder Kanalschlüssel aus, startet anschließend einen Loopback-Gateway und prüft die Beibehaltung von Konfiguration und Zustand sowie die Budgets für Start und Status.
- Veröffentlichter Smoke-Test für das Überstehen eines Upgrades: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, legt realistische Dateien eines bestehenden Benutzers an, konfiguriert diese Basisversion mit einem integrierten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert die veröffentlichte Installation auf den Kandidaten-Tarball, führt Doctor nicht interaktiv aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend einen Loopback-Gateway und prüft konfigurierte Intentionen, die Beibehaltung des Zustands, den Start sowie die Statusbudgets für `/healthz`, `/readyz` und RPC. Überschreiben Sie eine Basisversion mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, weisen Sie den aggregierten Scheduler mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` an, exakte lokale Basisversionen wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` zu erweitern, und erweitern Sie problembezogene Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` wie `reported-issues`; die Gruppe gemeldeter Probleme umfasst `configured-plugin-installs` für die automatische Reparatur der Installation externer OpenClaw-Plugins. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit, löst Meta-Basisversions-Token wie `last-stable-4` oder `all-since-2026.4.23` auf, und Full Release Validation erweitert das Paket-Gate für den Release-Dauertest auf `last-stable-4 2026.4.23 2026.5.2 2026.4.15` sowie `reported-issues`.
- Smoke-Test für den Sitzungslaufzeitkontext: `pnpm test:docker:session-runtime-context` überprüft die Persistenz verborgener Laufzeitkontext-Transkripte sowie die Reparatur betroffener duplizierter Zweige zur Prompt-Umschreibung durch Doctor.
- Smoke-Test für die globale Bun-Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Quellbaum, installiert ihn mit `bun install -g` in einem isolierten Home-Verzeichnis und überprüft, dass `openclaw infer image providers --json` die gebündelten Bild-Provider zurückgibt, anstatt hängen zu bleiben. Verwenden Sie einen vorab erstellten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-Smoke-Test für das Installationsprogramm: `bash scripts/test-install-sh-docker.sh` verwendet einen gemeinsamen npm-Cache für seine Root-, Update- und Direct-npm-Container. Der Update-Smoke-Test verwendet standardmäßig npm `latest` als stabile Basisversion, bevor das Upgrade auf den Kandidaten-Tarball erfolgt. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Die Prüfungen des Installationsprogramms ohne Root-Rechte behalten einen isolierten npm-Cache bei, damit Cache-Einträge im Besitz von Root das benutzerlokale Installationsverhalten nicht verdecken. Legen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` fest, um den Root-/Update-/Direct-npm-Cache bei lokalen Wiederholungen erneut zu verwenden.
- Install Smoke CI überspringt das doppelte globale Direct-npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Umgebungsvariable aus, wenn eine Abdeckung für direktes `npm install -g` erforderlich ist.
- CLI-Smoke-Test zum Löschen eines gemeinsam genutzten Workspace durch Agents: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Image aus dem Root-Dockerfile, legt in einem isolierten Container-Home-Verzeichnis zwei Agents mit einem Workspace an, führt `agents delete --json` aus und überprüft gültiges JSON sowie das Verhalten des beibehaltenen Workspace. Verwenden Sie das Install-Smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` erneut.
- Gateway-Netzwerk und Host-Lebenszyklus: `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`) erhält den LAN-WebSocket-Smoke-Test für Authentifizierung und Integrität mit zwei Containern und verwendet anschließend Admin-HTTP über Loopback, um Prepare-Fencing, Zugriff mit beibehaltener Steuerung, Wiederherstellung durch Fortsetzen und einen vorbereiteten Stopp/Start desselben Containers nachzuweisen. Die Neustartprüfung muss abgeschlossen sein, bevor die ursprüngliche Lease abläuft, verifiziert, dass der Suspendierungszustand prozesslokal ist, während die persistierte Gateway-Konfiguration und Containeridentität erhalten bleiben, und gibt maschinenlesbares JSON mit den Phasenlaufzeiten aus.
- Smoke-Test für Browser-CDP-Snapshots: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) erstellt das Quell-E2E-Image sowie eine Chromium-Schicht, startet Chromium mit unverarbeitetem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, durch den Cursor zu klickbaren Elementen hochgestufte Elemente, iframe-Referenzen und Frame-Metadaten abdecken.
- Regression bei minimalem Reasoning für OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen simulierten OpenAI-Server über das Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` erhöht, erzwingt anschließend die Ablehnung durch das Provider-Schema und prüft, ob das unverarbeitete Detail in den Gateway-Protokollen erscheint.
- MCP-Kanal-Bridge (vorbelegtes Gateway + stdio-Bridge + Smoke-Test für unverarbeitete Claude-Benachrichtigungs-Frames): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-Tools des OpenClaw-Bundles (echter stdio-MCP-Server + Smoke-Test für Zulassen/Ablehnen im eingebetteten OpenClaw-Profil): `pnpm test:docker:agent-bundle-mcp-tools` (Skript: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- MCP-Bereinigung für Cron/Subagent (echtes Gateway + Beenden des stdio-MCP-Kindprozesses nach isolierten Cron- und einmaligen Subagent-Ausführungen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Installations-/Aktualisierungs-Smoke-Test für lokalen Pfad, `file:`, npm-Registry mit hochgezogenen Abhängigkeiten, fehlerhafte npm-Paketmetadaten, bewegliche Git-Referenzen, umfassendes ClawHub-Paket, Marketplace-Aktualisierungen und Aktivieren/Prüfen des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige umfassende Paket/Laufzeit-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Smoke-Test für unveränderte Plugin-Aktualisierung: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-Test für die Plugin-Lebenszyklusmatrix: `pnpm test:docker:plugin-lifecycle-matrix` installiert den gepackten OpenClaw-Tarball in einem leeren Container, installiert ein npm-Plugin, schaltet es ein und aus, führt über eine lokale npm-Registry ein Upgrade und Downgrade durch, löscht den installierten Code und verifiziert anschließend, dass die Deinstallation weiterhin veralteten Zustand entfernt, während für jede Lebenszyklusphase RSS-/CPU-Metriken protokolliert werden.
- Smoke-Test für Metadaten beim Neuladen der Konfiguration: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Installations-/Aktualisierungs-Smoke-Tests für lokalen Pfad, `file:`, npm-Registry mit hochgezogenen Abhängigkeiten, bewegliche Git-Referenzen, ClawHub-Fixtures, Marketplace-Aktualisierungen und Aktivieren/Prüfen des Claude-Bundles ab. `pnpm test:docker:plugin-update` deckt unverändertes Aktualisierungsverhalten für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt die ressourcenüberwachte Installation, Aktivierung, Deaktivierung, das Upgrade, Downgrade und die Deinstallation bei fehlendem Code eines npm-Plugins ab.

So erstellen Sie das gemeinsam genutzte funktionale Image vorab manuell und verwenden es wieder:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Überschreibungen wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image verweist, laden die Skripte es herunter, sofern es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, da sie das Paket-/Installationsverhalten und nicht die gemeinsam genutzte Laufzeitumgebung der gebauten Anwendung validieren.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein
und stellen ihn in einem temporären Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das
Laufzeit-Image schlank, während Vitest weiterhin mit Ihrem exakten lokalen
Quellcode und Ihrer Konfiguration ausgeführt wird. Der Bereitstellungsschritt überspringt große, ausschließlich lokale Caches und Build-
Ausgaben der Anwendung wie `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie
anwendungslokale `.build`- oder Gradle-Ausgabeverzeichnisse, damit Docker-Live-Ausführungen nicht
mehrere Minuten mit dem Kopieren rechnerspezifischer Artefakte verbringen. Außerdem setzen sie
`OPENCLAW_SKIP_CHANNELS=1`, damit Live-Probes des Gateways keine echten
Telegram-/Discord-/usw.-Channel-Worker innerhalb des Containers starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus. Übergeben Sie daher bei Bedarf auch
`OPENCLAW_LIVE_GATEWAY_*`, um die Live-Abdeckung des Gateways in dieser Docker-Ausführung
einzuschränken oder auszuschließen.

`test:docker:openwebui` ist ein Kompatibilitäts-Smoke-Test auf höherer Ebene: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen auf eine feste Version gesetzten Open-WebUI-Container für dieses Gateway, meldet sich über
Open WebUI an, überprüft, dass `/api/models` das Modell `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI. Setzen Sie
`OPENWEBUI_SMOKE_MODE=models` für CI-Prüfungen des Release-Pfads, die
nach der Anmeldung bei Open WebUI und der Modellerkennung beendet werden sollen, ohne auf den Abschluss
einer Live-Modellanfrage zu warten. Der erste Durchlauf kann deutlich länger dauern, da Docker möglicherweise
das Open-WebUI-Image abrufen und Open WebUI möglicherweise seine eigene
Kaltstart-Einrichtung abschließen muss. Diese Lane erwartet einen verwendbaren Live-Modellschlüssel, der über
die Prozessumgebung, bereitgestellte Authentifizierungsprofile oder eine explizite
`OPENCLAW_PROFILE_FILE` bereitgestellt wird. Erfolgreiche Durchläufe geben eine kleine JSON-Nutzlast wie
`{ "ok": true, "model": "openclaw/default", ... }` aus.

`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen mit Ausgangsdaten versehenen Gateway-
Container sowie einen zweiten Container, der `openclaw mcp serve` startet, und
überprüft anschließend die Erkennung gerouteter Konversationen, das Lesen von Transkripten, Anhangs-
metadaten, das Verhalten der Live-Ereigniswarteschlange, das Routing ausgehender Nachrichten sowie Kanal- und
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die
Benachrichtigungsprüfung untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test
validiert, was die Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK
zufällig bereitstellt.

`test:docker:agent-bundle-mcp-tools` ist deterministisch und benötigt keinen
Live-Modellschlüssel. Es erstellt das Docker-Image des Repositorys, startet einen echten stdio-MCP-
Probe-Server im Container, materialisiert diesen Server über die
eingebettete MCP-Laufzeit des OpenClaw-Bundles, führt das Tool aus und überprüft anschließend,
dass `coding` und `messaging` die `bundle-mcp`-Tools beibehalten, während `minimal` und
`tools.deny: ["bundle-mcp"]` sie herausfiltern.

`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen
Live-Modellschlüssel. Es startet ein mit Ausgangsdaten versehenes Gateway mit einem echten stdio-MCP-Probe-Server,
führt einen isolierten Cron-Durchlauf und einen einmaligen untergeordneten `sessions_spawn`-Durchlauf aus und
überprüft anschließend, dass der untergeordnete MCP-Prozess nach jedem Durchlauf beendet wird.

Manueller ACP-Smoke-Test für Threads in natürlicher Sprache (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bewahren Sie dieses Skript für Regressions-/Debugging-Workflows auf. Es kann erneut für die Validierung des ACP-Thread-Routings benötigt werden; löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), eingebunden unter `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), eingebunden unter `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`, wird eingebunden und vor der Ausführung der Tests eingelesen
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um ausschließlich die aus `OPENCLAW_PROFILE_FILE` eingelesenen Umgebungsvariablen zu überprüfen; dabei werden temporäre Konfigurations-/Arbeitsbereichsverzeichnisse und keine externen CLI-Authentifizierungseinbindungen verwendet
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`, sofern der Durchlauf nicht bereits ein CI-/verwaltetes Bind-Verzeichnis verwendet), eingebunden unter `/home/node/.npm-global` für zwischengespeicherte CLI-Installationen innerhalb von Docker
- Externe CLI-Authentifizierungsverzeichnisse/-dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse (werden verwendet, wenn der Durchlauf nicht auf bestimmte Provider eingegrenzt ist): `.factory`, `.gemini`, `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Auf Provider eingegrenzte Durchläufe binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelle Überschreibung mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Durchlauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider innerhalb des Containers zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für erneute Durchläufe wiederzuverwenden, die keine Neuerstellung benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher stammen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke-Test bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke-Test verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das festgelegte Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfungen der Dokumentation

Führen Sie nach Änderungen an der Dokumentation Dokumentationsprüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Ankervalidierung aus, wenn Sie auch Überschriften innerhalb von Seiten prüfen müssen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Aufrufe (OpenAI-Mock, echtes Gateway + Agentenschleife): `src/gateway/gateway.test.ts` (Testfall: „führt einen simulierten OpenAI-Tool-Aufruf vollständig über die Gateway-Agentenschleife aus“)
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Authentifizierung erzwungen): `src/gateway/gateway.test.ts` (Testfall: „führt den Assistenten über WS aus und schreibt die Konfiguration des Authentifizierungstokens“)

## Zuverlässigkeitsevaluierungen für Agenten (Skills)

Wir verfügen bereits über einige CI-sichere Tests, die sich wie „Zuverlässigkeitsevaluierungen für Agenten“ verhalten:

- Simulierte Tool-Aufrufe über das echte Gateway und die Agentenschleife (`src/gateway/gateway.test.ts`).
- Durchgängige Assistentenabläufe, die die Sitzungsverdrahtung und Konfigurationsauswirkungen validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wählt der Agent, wenn Skills im Prompt aufgeführt sind, den richtigen Skill aus (oder vermeidet irrelevante)?
- **Konformität:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrstufige Szenarien, die die Tool-Reihenfolge, die Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Künftige Evaluierungen sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit simulierten Providern, der Tool-Aufrufe und deren Reihenfolge, das Lesen von Skill-Dateien sowie die Sitzungsverdrahtung prüft.
- Eine kleine Suite Skill-orientierter Szenarien (verwenden oder vermeiden, Zugriffsbeschränkung, Prompt-Injection).
- Optionale Live-Evaluierungen (Opt-in, durch Umgebungsvariablen gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalstruktur)

Vertragstests überprüfen, ob jedes registrierte Plugin und jeder registrierte Kanal seinem
Schnittstellenvertrag entspricht. Sie durchlaufen alle erkannten Plugins und führen eine
Suite von Struktur- und Verhaltensprüfungen aus. Die standardmäßige Unit-Lane von `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führen Sie die Vertrags-
befehle explizit aus, wenn Sie gemeinsam genutzte Kanal- oder Provider-Oberflächen ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`. Aktuelle
Kategorien der obersten Ebene:

- **channel-catalog** – Metadaten von Katalogeinträgen gebündelter/registrierter Kanäle
- **plugin** (registrierungsbasiert, in Shards aufgeteilt) – grundlegende Registrierungsstruktur des Plugins
- **surfaces-only** (registrierungsbasiert, in Shards aufgeteilt) – oberflächenspezifische Strukturprüfungen für `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` und `gateway`
- **session-binding** (registrierungsbasiert) – Verhalten der Sitzungsbindung
- **outbound-payload** – Struktur und Normalisierung der Nachrichtennutzlast
- **group-policy** (Fallback) – Durchsetzung der standardmäßigen Gruppenrichtlinie pro Kanal
- **threading** (registrierungsbasiert, in Shards aufgeteilt) – Handhabung von Thread-IDs
- **directory** (registrierungsbasiert, in Shards aufgeteilt) – Verzeichnis-/Teilnehmerlisten-API
- **registry** und **plugins-core.\*** – interne Logik für Kanal-Plugin-Registrierung, Loader und Autorisierung von Konfigurationsschreibvorgängen

Hilfsfunktionen des Test-Harness für die Erfassung eingehender Weiterleitungen und ausgehende Nutzlasten, die von diesen
Suites verwendet werden, sind intern über `src/plugin-sdk/channel-contract-testing.ts`
verfügbar (von npm ausgeschlossen, kein öffentlicher SDK-Unterpfad); in diesem Verzeichnis gibt es keine eigenständige
Datei `inbound.contract.test.ts`.

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`. Aktuelle Kategorien
umfassen:

- **shape** – Struktur von Plugin-Manifest, API und Laufzeitexporten
- **plugin-registration** (+ parallel) – Fälle der Manifestregistrierung
- **package-manifest** – Anforderungen an das Paketmanifest
- **loader** – Einrichtungs-/Bereinigungsverhalten des Plugin-Loaders
- **registry** – Inhalte und Suche der Plugin-Vertragsregistrierung
- **providers** – gemeinsames Provider-Verhalten für gebündelte Provider sowie Websuch-Provider
- **auth-choice** – Metadaten zur Authentifizierungsauswahl und Einrichtungsverhalten
- **provider-catalog-deprecation** – Metadaten zu veralteten Provider-Katalogen
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** – Verträge des Provider-Einrichtungsassistenten
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** – funktionsspezifische Provider-Verträge
- **session-actions**, **session-attachments**, **session-entry-projection** – Plugin-eigene Verträge für den Sitzungsstatus
- **scheduled-turns** – Metadaten geplanter Plugin-Durchläufe und Zeitstempelgrenzen
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** – Verträge für Plugin-Host-/Laufzeitlebenszyklus und Importgrenzen
- **extension-runtime-dependencies** – Platzierung von Laufzeitabhängigkeiten für Erweiterungen

### Wann auszuführen

- Nach Änderungen an Plugin-SDK-Exporten oder Unterpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach der Umstrukturierung der Plugin-Registrierung oder -Erkennung

Vertragstests werden in CI ausgeführt und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein bei Live-Tests entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassung der exakten Transformation der Anfragestruktur)
- Wenn das Problem grundsätzlich nur live auftritt (Ratenlimits, Authentifizierungsrichtlinien), halten Sie den Live-Test eng begrenzt und per Umgebungsvariablen optional aktivierbar
- Zielen Sie vorzugsweise auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei der Konvertierung/Wiedergabe von Provider-Anfragen -> direkter Modelltest
  - Fehler in Gateway-Sitzung/Verlauf/Tool-Pipeline -> Gateway-Live-Smoke-Test oder CI-sicherer Gateway-Mock-Test
- Schutzvorkehrung für SecretRef-Traversierung:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus den Registrierungsmetadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel pro SecretRef-Klasse ab und prüft anschließend, dass Ausführungs-IDs mit Traversierungssegmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie mit `includeInPlan` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt bei nicht klassifizierten Ziel-IDs absichtlich fehl, damit neue Klassen nicht unbemerkt übersprungen werden können.

## Verwandte Themen

- [Live-Tests](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
- [CI](/de/ci)
