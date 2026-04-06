---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Provider-Bugs hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Testing-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was die einzelnen Tests abdecken'
title: Testing
x-i18n:
    generated_at: "2026-04-06T03:09:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfa174e565df5fdf957234b7909beaf1304aa026e731cc2c433ca7d931681b56
    source_path: help/testing.md
    workflow: 15
---

# Testing

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Anzahl von Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie absichtlich _nicht_ abdeckt)
- Welche Befehle für gängige Arbeitsabläufe ausgeführt werden sollten (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der gesamten Suite auf einer leistungsfähigen Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife (moderne Projects-Konfiguration): `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Erweiterungs-/Channel-Pfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine Live-Datei gezielt und ruhig ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, grenzen Sie Live-Tests möglichst über die unten beschriebenen Allowlist-Umgebungsvariablen ein.

## Test-Suites (was wo ausgeführt wird)

Betrachten Sie die Suites als „zunehmenden Realismus“ (und zunehmende Fehleranfälligkeit/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: natives Vitest-`projects` über `vitest.config.ts`
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` sowie die per Allowlist freigegebenen `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Wird in CI ausgeführt
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projects:
  - `pnpm test`, `pnpm test:watch` und `pnpm test:changed` verwenden jetzt dieselbe native Vitest-Root-`projects`-Konfiguration.
  - Direkte Dateifilter werden nativ über den Root-Projektgraphen weitergeleitet, daher funktioniert `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ohne benutzerdefinierten Wrapper.
- Hinweis zum eingebetteten Runner:
  - Wenn Sie Eingaben für die Message-Tool-Erkennung oder den Laufzeitkontext für Compaction ändern,
    halten Sie beide Ebenen der Abdeckung aufrecht.
  - Fügen Sie gezielte Helper-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die eingebetteten Runner-Integrationssuites intakt:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suites verifizieren, dass Scoped-IDs und Compaction-Verhalten weiterhin
    durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Helper-Tests sind
    kein ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über die Root-Projekte sowie die E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihre `jsdom`-Einrichtung und Optimierung bei, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - `pnpm test` erbt dieselben Standardwerte `threads` + `isolate: false` aus der `projects`-Konfiguration in der Root-`vitest.config.ts`.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt jetzt standardmäßig auch `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um bei großen lokalen Läufen den V8-Kompilierungsaufwand zu verringern. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie mit dem Standardverhalten von V8 vergleichen müssen.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` führt die native Projects-Konfiguration mit `--changed origin/main` aus.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dieselbe native Projects-Konfiguration bei, nur mit einer höheren Worker-Obergrenze.
  - Die automatische Skalierung lokaler Worker ist jetzt absichtlich konservativ und reduziert sich auch, wenn die durchschnittliche Host-Last bereits hoch ist, sodass mehrere gleichzeitige Vitest-Ausführungen standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekt-/Konfigurationsdateien als `forceRerunTriggers`, damit erneute Läufe im Changed-Modus korrekt bleiben, wenn sich die Testverkabelung ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Ort für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert Berichte zur Vitest-Importdauer sowie Ausgaben zur Importaufschlüsselung.
  - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die sich seit `origin/main` geändert haben.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest/Vite-Start und Transformations-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU- + Heap-Profile des Runners für die Unit-Suite bei deaktivierter Dateiparallelität.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Standardwerte zur Laufzeit:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repositorys.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Konsolen-I/O-Overhead zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker zu erzwingen (maximal 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateway mit mehreren Instanzen
  - WebSocket-/HTTP-Schnittstellen, Node-Pairing und umfangreicheres Networking
- Erwartungen:
  - Wird in CI ausgeführt (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Exec
  - Verifiziert kanonisches Remote-Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur opt-in; nicht Teil der Standardausführung von `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI und einen funktionierenden Docker-Daemon
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend Test-Gateway und Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test bei manueller Ausführung der breiteren E2E-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erkennt Änderungen an Provider-Formaten, Besonderheiten bei Tool-Calls, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Führen Sie lieber eingegrenzte Teilmengen statt „alles“ aus
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen leiseren Modus: Es behält die `[live] ...`-Fortschrittsausgabe bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Chatter stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Start-Logs wieder möchten.
- Rotation von API-Schlüsseln (provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder verwenden Sie pro Live-Override `OPENCLAW_LIVE_*_KEY`; Tests versuchen bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen an stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Vitest-Konsolenerfassung leise ist.
  - `vitest.live.config.ts` deaktiviert die Konsoleninterzeption von Vitest, sodass Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Steuern Sie Heartbeats direkter Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Steuern Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: `pnpm test:e2e` ergänzen
- „Mein Bot ist down“ / providerspezifische Fehler / Tool-Calling debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Node aufrufen und das Vertragsverhalten des Befehls validieren.
- Umfang:
  - Vorbereitete/manuelle Einrichtung (die Suite installiert/startet/pairt die App nicht).
  - Gateway-`node.invoke`-Validierung Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliche Vorbereitung:
  - Android-App bereits verbunden und mit dem Gateway gepairt.
  - App im Vordergrund belassen.
  - Berechtigungen/Aufnahmezustimmung für Capabilities gewähren, die erfolgreich sein sollen.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profile Keys)

Live-Tests sind in zwei Ebenen aufgeteilt, damit Fehler isoliert werden können:

- „Direct model“ zeigt uns, dass der Provider/das Modell mit dem gegebenen Schlüssel überhaupt antworten kann.
- „Gateway smoke“ zeigt uns, dass die vollständige Gateway- + Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modellvervollständigung (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle auflisten
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Anmeldedaten haben
  - Eine kleine Completion pro Modell ausführen (und bei Bedarf gezielte Regressionen)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity"` (Komma-Allowlist)
- Herkunft der Schlüssel:
  - Standardmäßig: Profile Store und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profile Store zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway- + Dev-Agent-Smoke (was „@openclaw“ tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway hochfahren
  - Eine `agent:dev:*`-Sitzung erstellen/patchen (Modell-Override pro Lauf)
  - Modelle-mit-Schlüsseln iterieren und sicherstellen:
    - „aussagekräftige“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes funktionieren (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie mit `read` zu lesen und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agenten auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann mit `read` zurückzulesen.
  - Bild-Probe: Der Test hängt ein generiertes PNG an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Referenz zur Implementierung: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste), um einzugrenzen
- Providerauswahl (vermeiden Sie „alles über OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- + Bild-Probes sind in diesem Live-Test immer aktiv:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe wird ausgeführt, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Ablauf (high level):
    - Test generiert ein kleines PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet es per `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Attachments in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleinere Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrer Maschine testen können (und die genauen `provider/model`-IDs), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Conversation-Bind-Flow mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation an Ort und Stelle binden
  - ein normales Follow-up in derselben Konversation senden
  - verifizieren, dass das Follow-up im gebundenen ACP-Sitzungsprotokoll landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agent: `claude`
  - Synthetischer Channel: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit rein administrativen synthetischen Feldern für die Ursprungroute, damit Tests Message-Channel-Kontext anhängen können, ohne vorzutäuschen, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agenten.

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

Docker-Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Er sourct `~/.profile`, stellt passendes CLI-Auth-Material im Container bereit, installiert `acpx` in ein beschreibbares npm-Präfix und installiert anschließend bei Bedarf die angeforderte Live-CLI (`@anthropic-ai/claude-code` oder `@openai/codex`).
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` die Provider-Umgebungsvariablen aus dem gesourcten Profil für die Child-Harness-CLI verfügbar hält.

### Empfohlene Live-Rezepte

Eingegrenzte, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus auf Google (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpunkt).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwickler-Maschine mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Calling + Bild)

Dies ist der Lauf für die „gängigen Modelle“, den wir funktionsfähig halten möchten:

- OpenAI (nicht Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (vermeiden Sie ältere Gemini-2.x-Modelle)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool-Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder das neueste verfügbare Modell)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Attachment → multimodale Nachricht)

Fügen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` ein (Claude-/Gemini-/OpenAI-Varianten mit Vision-Fähigkeit usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie passende Schlüssel aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- + Bildfähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Anmeldedaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, „alle Modelle“ in der Dokumentation fest zu verdrahten. Die maßgebliche Liste ist, was `discoverModels(...)` auf Ihrer Maschine zurückgibt plus welche Schlüssel verfügbar sind.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „no creds“ meldet, debuggen Sie ihn genauso, wie Sie `openclaw models list` / die Modellauswahl debuggen würden.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist die Bedeutung von „profile keys“ in den Live-Tests)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-State-Verzeichnis: `~/.openclaw/credentials/` (wird, falls vorhanden, in das vorbereitete Live-Home kopiert, ist aber nicht der Hauptspeicher für Profile Keys)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; Überschreibungen von Pfaden in `agents.*.workspace` / `agentDir` werden in dieser vorbereiteten Konfiguration entfernt, damit Probes nicht gegen Ihren echten Host-Workspace laufen.

Wenn Sie Env-Schlüssel verwenden möchten (z. B. exportiert in Ihrer `~/.profile`), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (diese können `~/.profile` in den Container mounten).

## Deepgram live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionales Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten comfy-Pfade für Bilder, Videos und `music_generate`
  - Überspringt jede Capability, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Umfang:
  - Listet jedes registrierte Bildgenerierungs-Provider-Plugin auf
  - Lädt fehlende Provider-Env-Variablen vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne brauchbare Auth/Profile/Modelle
  - Führt die Standardvarianten der Bildgenerierung über die gemeinsame Runtime-Capability aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktuell abgedeckte gebündelte Provider:
  - `openai`
  - `google`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile Store zu erzwingen und reine Env-Overrides zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Umfang:
  - Testet den gemeinsamen gebündelten Pfad für Musikgenerierungs-Provider
  - Deckt derzeit Google und MiniMax ab
  - Lädt vor dem Probing Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`)
  - Überspringt Provider ohne brauchbare Auth/Profile/Modelle
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen auf:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur die jeweilige passende Live-Datei für Profile Keys innerhalb des Docker-Images des Repositorys aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace gemountet werden (und `~/.profile` gesourct wird, falls gemountet). Die passenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  ausdrücklich den größeren erschöpfenden Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Live-Docker-Lanes wieder.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle mounten außerdem nur die benötigten CLI-Auth-Homes per Bind-Mount (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie vor dem Lauf in das Container-Home, sodass OAuth externer CLI-Tools Tokens aktualisieren kann, ohne den Auth-Store des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Channel-Bridge (vorgesätes Gateway + stdio-Bridge + roher Claude-Notification-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Install-Smoke + `/plugin`-Alias + Restart-Semantik für Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle mounten außerdem den aktuellen Checkout schreibgeschützt und
stellen ihn in einem temporären Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest weiterhin gegen Ihren exakten lokalen Quellcode/Ihre Konfiguration ausgeführt wird.
Der Bereitstellungsschritt überspringt große lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang maschinenspezifische Artefakte kopieren.
Außerdem setzen sie `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/usw.-Channel-Worker innerhalb des Containers starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, geben Sie daher
auch `OPENCLAW_LIVE_GATEWAY_*` weiter, wenn Sie Gateway-Live-Abdeckung in dieser Docker-Lane
eingrenzen oder ausschließen möchten.
`test:docker:openwebui` ist ein Smoke-Test auf höherer Kompatibilitätsebene: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen fest gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise erst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise seinen eigenen Kaltstart abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorgesäten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann geroutete Konversationserkennung, das Lesen von Transkripten, Attachment-Metadaten,
Verhalten der Live-Event-Queue, ausgehendes Send-Routing sowie Claude-artige Channel- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Notification-Prüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test validiert, was die
Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Smoke für Plain-Language-Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows bei. Es könnte erneut für die Validierung des ACP-Thread-Routings benötigt werden, also löschen Sie es nicht.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` gemountet und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` gemountet, um CLI-Installationen in Docker zwischenzuspeichern
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelle Überschreibung mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profile Store stammen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das fest gepinnte Open-WebUI-Image-Tag zu überschreiben

## Dokumentations-Sanity-Check

Führen Sie nach Bearbeitungen an der Dokumentation die Doku-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie zusätzlich Prüfungen für In-Page-Überschriften benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (gemocktes OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + erzwingt Auth): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evaluierungen zur Agent-Zuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evaluierungen zur Agent-Zuverlässigkeit“ verhalten:

- Gemocktes Tool-Calling durch die echte Gateway- + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die Sitzungsverkabelung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wählt der Agent, wenn Skills im Prompt aufgelistet sind, den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen sicherstellen.

Zukünftige Evaluierungen sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit gemockten Providern, um Tool-Calls + Reihenfolge, das Lesen von Skill-Dateien und Sitzungsverkabelung sicherzustellen.
- Eine kleine Suite von skillfokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evaluierungen (opt-in, env-gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Shape)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Channel seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite von
Assertions zu Shape und Verhalten aus. Die standardmäßige Unit-Lane von `pnpm test`
überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit
aus, wenn Sie gemeinsame Channel- oder Provider-Oberflächen anfassen.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Befinden sich unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Shape (ID, Name, Capabilities)
- **setup** - Vertragsverhalten des Setup-Assistenten
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Message-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Channel-Aktionen
- **threading** - Behandlung von Thread-IDs
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Status-Verträge

Befinden sich unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status-Probes für Channels
- **registry** - Shape der Plugin-Registry

### Provider-Verträge

Befinden sich unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auswahl/Selektion von Auth
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Laden von Plugins
- **runtime** - Provider-Runtime
- **shape** - Plugin-Shape/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder -Subpfaden
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder -Erkennung

Vertragstests werden in CI ausgeführt und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein Provider-/Modellproblem beheben, das in Live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (gemockter/gestubbter Provider oder die exakte Transformation der Request-Shape erfassen)
- Wenn es inhärent nur live testbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng eingegrenzt und opt-in über Env-Variablen
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Bug erkennt:
  - Bug in Provider-Request-Konvertierung/-Replay → Test für direkte Modelle
  - Bug in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel pro SecretRef-Klasse ab und stellt dann sicher, dass Exec-IDs von Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie mit `includeInPlan` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend ausgelassen werden.
