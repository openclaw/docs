---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Fehlerbehebung bei Gateway- und Agentenverhalten
summary: 'Test-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was die einzelnen Tests abdecken'
title: Tests
x-i18n:
    generated_at: "2026-04-11T02:45:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55e75d056306a77b0d112a3902c08c7771f53533250847fc3d785b1df3e0e9e7
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Gruppe von Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, **wie wir testen**:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Sie Regressionstests für reale Modell-/Provider-Probleme hinzufügen

## Schnellstart

An den meisten Tagen:

- Vollständige Prüfkette (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der vollständigen Suite auf einem leistungsstarken Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Ausführungen, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Strecke: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit möchten:

- Coverage-Prüfung: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Prüfungen): `pnpm test:live`
- Eine einzelne Live-Datei ohne viel Ausgabe ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen fehlschlagenden Fall benötigen, grenzen Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen ein.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttest-Suites zur Verfügung, wenn Sie die Realitätsnähe von QA-lab benötigen:

- `pnpm openclaw qa suite`
  - Führt Repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten Gateway-Workern aus, mit bis zu 64 Workern oder der Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder `--concurrency 1` für die ältere serielle Strecke.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Flags zur Auswahl von Providern/Modellen wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den Gast praktikabel sind: umgebungsvariablenbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`, falls vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeit.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Strecke gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus.
  - Stellt drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum bereit und startet dann ein untergeordnetes QA-Gateway mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das festgelegte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie es mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Ereignissen unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Strecke gegen eine echte private Gruppe aus, unter Verwendung der Driver- und SUT-Bot-Tokens aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Aktivieren Sie für eine stabile Bot-zu-Bot-Beobachtung den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Bot-Datenverkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`.

Live-Transport-Strecken teilen sich einen einheitlichen Standardvertrag, damit neue Transporte nicht auseinanderdriften:

`qa-channel` bleibt die breit angelegte synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Strecke  | Canary | Mention-Gating | Allowlist-Blockierung | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Nachverfolgung | Thread-Isolation | Beobachtung von Reaktionen | Help-Befehl |
| -------- | ------ | -------------- | --------------------- | -------------------------- | ------------------------ | --------------------- | ---------------- | -------------------------- | ------------ |
| Matrix   | x      | x              | x                     | x                          | x                        | x                     | x                | x                          |              |
| Telegram | x      |                |                       |                            |                          |                       |                  |                            | x            |

## Test-Suites (was wo läuft)

Betrachten Sie die Suites als „zunehmend realistisch“ (und zunehmend fehleranfällig/teuer):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequenzielle Shard-Ausführungen (`vitest.full-*.config.ts`) über die vorhandenen eingegrenzten Vitest-Projekte
- Dateien: Kern-/Unit-Bestände unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die auf der Allowlist stehenden `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionstests für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - Nicht gezieltes `pnpm test` führt jetzt elf kleinere Shard-Konfigurationen aus (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Projekt-Prozesses. Das senkt die maximale RSS auf ausgelasteten Rechnern und verhindert, dass Arbeiten an auto-reply/Erweiterungen nicht zusammenhängende Suites ausbremsen.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Watch-Schleife über mehrere Shards nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst über eingegrenzte Strecken weiter, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollen Startkosten des Root-Projekts verursacht.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben eingegrenzten Strecken, wenn der Diff nur routbare Quell-/Testdateien berührt; Konfigurations-/Setup-Änderungen fallen weiterhin auf die breite erneute Ausführung des Root-Projekts zurück.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, auto-reply-Hilfen, `plugin-sdk` und ähnlichen reinen Utility-Bereichen werden über die Strecke `unit-fast` geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitintensive Dateien bleiben auf den vorhandenen Strecken.
  - Ausgewählte Hilfsquellendateien in `plugin-sdk` und `commands` ordnen Runs im Changed-Modus ebenfalls explizit benachbarten Tests in diesen leichten Strecken zu, sodass Hilfsänderungen nicht die vollständige schwere Suite für dieses Verzeichnis erneut ausführen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Hilfen im Kern der obersten Ebene, Integrations-Tests der obersten Ebene `reply.*` und den Teilbaum `src/auto-reply/reply/**`. So bleibt die schwerste reply-Harness-Arbeit von günstigen Status-/Chunk-/Token-Tests getrennt.
- Hinweis zum eingebetteten Runner:
  - Wenn Sie Eingaben für die Nachrichtentool-Erkennung oder den Laufzeitkontext der Kompaktierung ändern, behalten Sie beide Abdeckungsebenen bei.
  - Fügen Sie gezielte Hilfs-Regressionstests für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die eingebetteten Runner-Integrations-Suites gesund:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suites verifizieren, dass eingegrenzte IDs und das Kompaktierungsverhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Hilfstests sind kein ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Strecke behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard übernimmt dieselben Standards `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt für untergeordnete Vitest-Node-Prozesse jetzt standardmäßig auch `--no-maglev` hinzu, um V8-Kompilierungsaufwand bei großen lokalen Ausführungen zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie mit dem Standardverhalten von V8 vergleichen müssen.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` leitet über eingegrenzte Strecken, wenn sich die geänderten Pfade sauber einer kleineren Suite zuordnen lassen.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
  - Die automatische lokale Worker-Skalierung ist jetzt bewusst konservativ und fährt auch zurück, wenn die Load Average des Hosts bereits hoch ist, sodass mehrere gleichzeitige Vitest-Ausführungen standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit erneute Ausführungen im Changed-Modus korrekt bleiben, wenn sich das Test-Wiring ändert.
  - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert die Berichterstellung zur Vitest-Importdauer sowie eine Aufschlüsselung der Importe.
  - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Projekt-Pfad für diesen festgeschriebenen Diff und gibt Wall Time sowie macOS-max-RSS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen verschmutzten Arbeitsbaum, indem die Liste geänderter Dateien über `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geleitet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest-/Vite-Start- und Transformations-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die Unit-Suite bei deaktivierter Dateiparallelität.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Standardwerte der Laufzeit:
  - Verwendet Vitest-`threads` mit `isolate: false` und entspricht damit dem Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten mehrerer Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil der standardmäßigen Ausführung `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ mit echten Anmeldedaten tatsächlich?“
  - Erfasst Änderungen an Provider-Formaten, Eigenheiten bei Tool-Aufrufen, Authentifizierungsprobleme und Verhalten bei Ratenbegrenzungen
- Erwartungen:
  - Von Natur aus nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Ratenlimits
  - Bevorzugt eingegrenzte Teilmengen statt „alles“
- Live-Ausführungen laden `~/.profile`, um fehlende API-Schlüssel zu übernehmen.
- Standardmäßig isolieren Live-Ausführungen weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Der `[live] ...`-Fortschritt bleibt sichtbar, aber der zusätzliche Hinweis zu `~/.profile` wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Ausgaben werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Start-Logs wieder sehen möchten.
- Rotation von API-Schlüsseln (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Überschreibung pro Live-Test über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Antworten mit Ratenbegrenzung erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen an stderr aus, sodass bei langen Provider-Aufrufen sichtbar bleibt, dass etwas passiert, auch wenn die Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, damit Fortschrittszeilen von Provider/Gateway bei Live-Ausführungen sofort gestreamt werden.
  - Stimmen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Heartbeats für Gateway/Prüfungen mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Pairing berühren: zusätzlich `pnpm test:e2e`
- „Mein Bot ist ausgefallen“ / providerspezifische Fehler / Tool-Aufrufe debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live: Android-Node-Fähigkeitssweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** eines verbundenen Android-Node aufrufen und das Verhalten gemäß Befehlsvertrag überprüfen.
- Umfang:
  - Vorkonfiguriertes/manuelles Setup (die Suite installiert/startet/paart die App nicht).
  - Validierung von Gateway-`node.invoke` Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliches Vorab-Setup:
  - Android-App ist bereits mit dem Gateway verbunden und gepairt.
  - App bleibt im Vordergrund.
  - Berechtigungen/Zustimmung zur Erfassung sind für die Fähigkeiten erteilt, die erfolgreich sein sollen.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zum Android-Setup: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ sagt uns, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ sagt uns, ob die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modellvervollständigung (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Anmeldedaten haben
  - Pro Modell eine kleine Vervollständigung ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit sich `pnpm test:live` auf Gateway-Smoke konzentriert
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
  - Moderne/alle Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signal; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für eine kleinere Obergrenze.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Woher die Schlüssel kommen:
  - Standardmäßig: Profilspeicher und Umgebungs-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um ausschließlich den **Profilspeicher** zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Replay von Reasoning + Tool-Call-Flows)

### Ebene 2: Gateway- + Dev-Agent-Smoke (was `@openclaw` tatsächlich macht)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway hochfahren
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modellüberschreibung pro Ausführung)
  - Über Modelle mit Schlüsseln iterieren und Folgendes prüfen:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (read-Prüfung)
    - optionale zusätzliche Tool-Prüfungen (exec+read-Prüfung)
    - OpenAI-Regressionspfade (nur Tool-Call → Folgeaufruf) funktionieren weiterhin
- Details zu den Prüfungen (damit Sie Fehler schnell erklären können):
  - `read`-Prüfung: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie mit `read` zu lesen und die Nonce zurückzugeben.
  - `exec+read`-Prüfung: Der Test fordert den Agenten auf, mit `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann mit `read` wieder zu lesen.
  - Bildprüfung: Der Test hängt ein erzeugtes PNG an (Katze + zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine Komma-Liste), um einzugrenzen
  - Moderne/alle Gateway-Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signal; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für eine kleinere Obergrenze.
- Providerauswahl (vermeidet „alles von OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- und Bildprüfungen sind in diesem Live-Test immer aktiviert:
  - `read`-Prüfung + `exec+read`-Prüfung (Tool-Stresstest)
  - Bildprüfung wird ausgeführt, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (überblicksartig):
    - Der Test erzeugt ein kleines PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Der eingebettete Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Prüfung: Die Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrem Rechner testen können (und die exakten IDs `provider/model`), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway-+Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Standard-Smoke-Werte pro Backend befinden sich in der Definition `cli-backend.ts` der jeweiligen Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Verhalten von Befehl/Argumenten/Bildern stammt aus den Metadaten des jeweiligen CLI-Backend-Plugins.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/vollständiger/pfad/zu/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt eingefügt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Ablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Prüfung der Sitzungsfortführung Claude Sonnet -> Opus zu deaktivieren (auf `1` setzen, um sie zu erzwingen, wenn das ausgewählte Modell ein Wechselziel unterstützt).

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-cli-backend
```

Docker-Rezepte für einzelne Provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als nicht-root-Benutzer `node` aus.
- Er löst CLI-Smoke-Metadaten aus der jeweiligen Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude-Code-Subscription-OAuth entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es beweist zunächst direktes `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Umgebungsvariablen beizubehalten. Diese Subscription-Strecke deaktiviert standardmäßig die Claude-MCP-/Tool- und Bildprüfungen, weil Claude die Nutzung von Drittanbieter-Apps derzeit über Extra-Usage-Abrechnung statt über normale Abo-Limits abwickelt.
- Der Live-CLI-Backend-Smoke testet jetzt denselben vollständigen End-to-End-Ablauf für Claude, Codex und Gemini: Text-Turn, Bildklassifizierungs-Turn und anschließend einen MCP-Tool-Aufruf `cron`, der über die Gateway-CLI verifiziert wird.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass sich die fortgesetzte Sitzung weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Conversation-Bind-Ablauf mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation direkt vor Ort binden
  - eine normale Folge-Nachricht in derselben Konversation senden
  - verifizieren, dass die Folge-Nachricht im Transcript der gebundenen ACP-Sitzung landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Strecke verwendet die Gateway-Oberfläche `chat.send` mit admin-only synthetischen Feldern für die Ursprungsroute, sodass Tests Message-Channel-Kontext anhängen können, ohne vorzugeben, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agent-Registry des eingebetteten Plugins `acpx` für den ausgewählten ACP-Harness-Agenten.

Beispiel:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-acp-bind
```

Docker-Rezepte für einzelne Agenten:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Hinweise zu Docker:

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agenten aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er lädt `~/.profile`, stellt das passende CLI-Authentifizierungsmaterial im Container bereit, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`), falls sie fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` die Provider-Umgebungsvariablen aus dem geladenen Profil für die untergeordnete Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: den plugin-eigenen Codex-Harness über die normale Gateway-Methode
  `agent` validieren:
  - das gebündelte Plugin `codex` laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agenten-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad ausführen
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Bildprüfung: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein defekter Codex-Harness nicht dadurch besteht, dass stillschweigend auf PI zurückgefallen wird.
- Authentifizierung: `OPENAI_API_KEY` aus Shell/Profil sowie optional kopierte
  `~/.codex/auth.json` und `~/.codex/config.toml`

Lokales Rezept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Hinweise zu Docker:

- Der Docker-Runner befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Er lädt das eingebundene `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-Authentifizierungsdateien, wenn vorhanden, installiert `@openai/codex` in ein beschreibbares eingebundenes npm-Präfix, stellt den Quellbaum bereit und führt dann nur den Live-Test des Codex-Harness aus.
- Docker aktiviert standardmäßig die Bild- und MCP-/Tool-Prüfungen. Setzen Sie `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, wenn Sie eine stärker eingegrenzte Debug-Ausführung benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none` und entspricht damit der Live-Testkonfiguration, sodass `openai-codex/*` oder ein PI-Fallback eine Regression des Codex-Harness nicht verbergen kann.

### Empfohlene Live-Rezepte

Schmale, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Aufrufe über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Agent-Endpunkt im Stil von Cloud Code Assist).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrem Rechner (separate Authentifizierung + Eigenheiten beim Tooling).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Schlüssel / Profil-Authentifizierung); das ist in der Regel das, was die meisten Benutzer mit „Gemini“ meinen.
  - CLI: OpenClaw ruft ein lokales Binary `gemini` auf; es hat eine eigene Authentifizierung und kann sich anders verhalten (Streaming/Tool-Unterstützung/Versionsabweichung).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einem Entwicklerrechner mit Schlüsseln abgedeckt werden sollten.

### Moderner Smoke-Satz (Tool-Aufrufe + Bild)

Dies ist die Ausführung für die „gängigen Modelle“, die wir funktionsfähig halten wollen:

- OpenAI (ohne Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Basislinie: Tool-Aufrufe (`Read` + optional `Exec`)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell aus, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Aufrufe hängen vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI-fähige Vision-Varianten usw.), um die Bildprüfung auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie entsprechende Schlüssel aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bildunterstützung zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Anmeldedaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, „alle Modelle“ in der Dokumentation fest zu codieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrem Rechner zurückgibt, plus die verfügbaren Schlüssel.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie ihn genauso wie `openclaw models list` / Modellauswahl.

- Authentifizierungsprofile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist mit „Profilschlüssel“ in den Live-Tests gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-Statusverzeichnis: `~/.openclaw/credentials/` (wird in das bereitgestellte Live-Test-Home kopiert, falls vorhanden, ist aber nicht der Hauptspeicher für Profilschlüssel)
- Lokale Live-Ausführungen kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json` pro Agent, Legacy-`credentials/` und unterstützte externe CLI-Authentifizierungsverzeichnisse in ein temporäres Test-Home; bereitgestellte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfadüberschreibungen für `agents.*.workspace` / `agentDir` werden entfernt, damit Prüfungen nicht auf Ihren echten Host-Workspace zugreifen.

Wenn Sie sich auf Umgebungsvariablen-Schlüssel verlassen möchten (z. B. in Ihrem `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die unten aufgeführten Docker-Runner (sie können `~/.profile` in den Container einbinden).

## Deepgram live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten comfy-Pfade für Bilder, Videos und `music_generate`
  - Überspringt jede Fähigkeit, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Provider-Plugin für Bildgenerierung auf
  - Lädt fehlende Provider-Umgebungsvariablen vor der Prüfung aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Authentifizierung/Profil/Modell
  - Führt die standardmäßigen Varianten der Bildgenerierung über die gemeinsame Runtime-Fähigkeit aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Derzeit abgedeckte gebündelte Provider:
  - `openai`
  - `google`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Authentifizierung über den Profilspeicher zu erzwingen und reine Umgebungsüberschreibungen zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen gebündelten Provider-Pfad für Musikgenerierung
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Umgebungsvariablen vor der Prüfung aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Authentifizierung/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit Eingabe nur per Prompt
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung in der gemeinsamen Strecke:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Authentifizierung über den Profilspeicher zu erzwingen und reine Umgebungsüberschreibungen zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen gebündelten Provider-Pfad für Videogenerierung
  - Lädt Provider-Umgebungsvariablen vor der Prüfung aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Authentifizierung/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit Eingabe nur per Prompt
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell in der gemeinsamen Strecke lokale Bildeingaben auf Buffer-Basis akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell in der gemeinsamen Strecke lokale Videoeingaben auf Buffer-Basis akzeptiert
  - Aktuell deklarierte, aber in der gemeinsamen Strecke übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine entfernte Bild-URL erfordert
  - Providerspezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie standardmäßig eine `kling`-Strecke aus, die eine Fixture mit entfernter Bild-URL verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber in der gemeinsamen Strecke übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit entfernte Referenz-URLs vom Typ `http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Strecke lokale Eingaben auf Buffer-Basis verwendet und dieser Pfad in der gemeinsamen Strecke nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Strecke Garantien für organisationsspezifischen Zugriff auf Video-Inpainting/Remix fehlen
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Authentifizierung über den Profilspeicher zu erzwingen und reine Umgebungsüberschreibungen zu ignorieren

## Media-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die aktuell verwendbare Authentifizierung haben
  - Verwendet `scripts/test-live.mjs` erneut, damit Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweilige Live-Datei für Profilschlüssel innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace eingebunden werden (und `~/.profile` geladen wird, falls eingebunden). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Umgebungsvariablen, wenn Sie ausdrücklich den größeren vollständigen Scan wollen.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Live-Strecken erneut.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Authentifizierungs-Homes ein (oder alle unterstützten, wenn die Ausführung nicht eingegrenzt ist) und kopieren sie dann vor der Ausführung in das Container-Home, damit OAuth externer CLI-Tools Tokens aktualisieren kann, ohne den Authentifizierungsspeicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Netzwerk (zwei Container, WS-Authentifizierung + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Kanal-Bridge (vorbefülltes Gateway + stdio-Bridge + Roh-Smoke für Claude-Benachrichtigungsframes): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Installations-Smoke + `/plugin`-Alias + Neustartsemantik des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und stellen ihn innerhalb des Containers in einem temporären Arbeitsverzeichnis bereit. So bleibt das Runtime-Image schlank und Vitest läuft trotzdem gegen Ihren exakten lokalen Quellcode/Ihre exakte lokale Konfiguration.
Der Bereitstellungsschritt überspringt große rein lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und App-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Ausführungen nicht minutenlang
rechnerspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Prüfungen im Container keine echten Kanal-Worker für Telegram/Discord usw. starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie in dieser Docker-Strecke die Gateway-Live-Abdeckung eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein Smoke zur Kompatibilität auf höherer Ebene: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten, startet einen
festgelegten Open-WebUI-Container gegen dieses Gateway, meldet sich über Open WebUI an,
verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Die erste Ausführung kann merklich langsamer sein, weil Docker möglicherweise das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise seinen eigenen Kaltstart abschließen muss.
Diese Strecke erwartet einen verwendbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist die primäre Methode, ihn in dockerisierten Ausführungen bereitzustellen.
Erfolgreiche Ausführungen geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen
Container mit vorbefülltem Gateway, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Konversationserkennung, das Lesen von Transcripts, Anhang-Metadaten,
Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen sowie Benachrichtigungen im Stil von Claude zu Kanal +
Berechtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was
die Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Simple-Language-Thread-Smoke (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows bei. Es könnte für die Validierung des ACP-Thread-Routings erneut benötigt werden, also löschen Sie es nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` eingebunden
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` eingebunden
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` eingebunden und vor dem Ausführen der Tests geladen
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` eingebunden, um CLI-Installationen in Docker zwischenzuspeichern
- Externe CLI-Authentifizierungsverzeichnisse/-dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Ausführungen binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um die Ausführung einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für erneute Ausführungen ohne Neubau wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher stammen (nicht aus der Umgebung)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Prompt zur Nonce-Prüfung zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das festgelegte Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfung für Dokumentation

Führen Sie nach Änderungen an der Dokumentation die Doku-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie zusätzlich Prüfungen für Überschriften innerhalb der Seite benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen für die „echte Pipeline“ ohne echte Provider:

- Gateway-Tool-Aufrufe (Mock OpenAI, echtes Gateway + Agent-Schleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + erzwungene Authentifizierung): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evals zur Agentenzuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evals zur Agentenzuverlässigkeit“ verhalten:

- Mock-Tool-Aufrufe über die echte Gateway- + Agent-Schleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die Sitzungsverdrahtung und Auswirkungen auf die Konfiguration validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent dann den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt er erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, das Lesen von Skill-Dateien und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite von skillfokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, über Umgebungsvariablen gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine
Suite von Prüfungen zu Form und Verhalten aus. Die standardmäßige Unit-Strecke `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führen Sie die
Vertragsbefehle explizit aus, wenn Sie gemeinsame Kanal- oder Provider-Oberflächen ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (id, name, capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Nutzlast
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Umgang mit Thread-IDs
- **directory** - API für Verzeichnis/Bestandsliste
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Statusprüfungen für Kanäle
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Authentifizierungsablaufs
- **auth-choice** - Authentifizierungswahl/-auswahl
- **catalog** - API für den Modellkatalog
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an `plugin-sdk`-Exporten oder Subpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refaktorierungen der Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitfaden)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub-Provider oder erfassen Sie die exakte Transformation der Anfrageform)
- Wenn das Problem von Natur aus nur live auftritt (Ratenlimits, Authentifizierungsrichtlinien), halten Sie den Live-Test schmal und aktivieren Sie ihn nur per Opt-in über Umgebungsvariablen
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Fehler erfasst:
  - Fehler bei Provider-Anfragekonvertierung/-Replay → Test für direkte Modelle
  - Fehler in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Durchlauf:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel pro SecretRef-Klasse ab und prüft dann, dass Durchlaufsegment-Exec-IDs abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue `includeInPlan`-SecretRef-Zielfamilie hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden.
