---
read_when:
    - Live-Smoke-Tests für Modellmatrix / CLI-Backend / ACP / Medien-Provider ausführen
    - Fehlerbehebung bei der Anmeldedatenauflösung für Live-Tests
    - Hinzufügen eines neuen providerspezifischen Live-Tests
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Zugangsdaten'
title: 'Tests: Live-Suiten'
x-i18n:
    generated_at: "2026-07-24T03:54:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0c5dfc4ce2e63461368a3f0bc35e5b7f5fcf2641695aa03dae8df2ea0438c4cc
    source_path: help/testing-live.md
    workflow: 16
---

Für den Schnellstart, QA-Runner, Unit-/Integrations-Suiten und Docker-Abläufe siehe
[Tests](/de/help/testing). Diese Seite behandelt **Live-Tests** (mit Netzwerkzugriff):
Modellmatrix, CLI-Backends, ACP, Medien-Provider und den Umgang mit Zugangsdaten.

## Live-Tests im Vergleich zu Ihrem realen Gateway

Live-Suiten und Ad-hoc-Smoke-Tests dürfen niemals ein Gateway stören, das bereits
realen Datenverkehr verarbeitet (Ihren oder den eines anderen Betreibers):

- Eigenes Gateway verwenden: Verwenden Sie das prozessinterne Gateway (Ebene 2 unten) oder starten Sie eine
  Entwicklungsinstanz mit einem isolierten Zustandsverzeichnis (`OPENCLAW_STATE_DIR=<scratch>`) und einem
  freien Port. Binden Sie nicht den Standard-Gateway-Port (18789), während darauf ein reales Gateway
  ausgeführt wird.
- Führen Sie `openclaw gateway stop`/`restart` (oder entsprechende `launchctl`/`systemctl`/tmux-
  Befehle) nicht für einen Dienst aus, den Sie in dieser Sitzung nicht gestartet haben – dabei handelt es sich um die
  Live-Instanz des Betreibers. Holen Sie zuerst eine ausdrückliche Genehmigung ein.
- Benötigen Sie realistische Daten? Kopieren Sie den Live-Zustand bzw. die Live-Datenbank in Ihr Entwicklungs-Zustandsverzeichnis und testen Sie
  mit der Kopie. Direkte Migrationen des Zustands eines Live-Gateways erfordern ebenfalls
  eine ausdrückliche Genehmigung.

## Live: lokale Smoke-Befehle

Exportieren Sie vor Ad-hoc-Live-Prüfungen den erforderlichen Provider-Schlüssel in die
Prozessumgebung.

Sicherer Medien-Smoke-Test:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw-Live-Smoke-Test." \
  --output /tmp/openclaw-live-smoke.mp3
```

Sicherer Smoke-Test für die Anrufbereitschaft:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Probelauf, sofern nicht auch `--yes` angegeben ist; verwenden Sie `--yes` nur,
wenn Sie tatsächlich einen Anruf tätigen möchten. Bei Twilio, Telnyx und Plivo erfordert eine
erfolgreiche Bereitschaftsprüfung eine öffentliche Webhook-URL – lokale/private
Loopback-URLs werden abgelehnt, da diese Provider sie nicht erreichen können.

## Live: Funktionsprüfung eines Android-Nodes

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden derzeit angebotenen Befehl** eines verbundenen Android-Nodes aufrufen und das Verhalten des Befehlsvertrags prüfen.
- Umfang:
  - Vorbereitete/manuelle Einrichtung (die Suite installiert, startet und koppelt die App nicht).
  - Befehlsspezifische Gateway-Validierung von `node.invoke` für den ausgewählten Android-Node.
- Erforderliche Vorbereitung:
  - Die Android-App ist bereits mit dem Gateway verbunden und gekoppelt.
  - Die App bleibt im Vordergrund.
  - Berechtigungen/Aufzeichnungszustimmung sind für die Funktionen erteilt, deren erfolgreichen Test Sie erwarten.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android-App](/de/platforms/android)

## Live: Modell-Smoke-Test (Profilschlüssel)

Live-Modelltests sind in zwei Ebenen aufgeteilt, damit Fehler isoliert werden:

- „Direktes Modell“ zeigt, ob der Provider bzw. das Modell mit dem angegebenen Schlüssel grundsätzlich antworten kann.
- „Gateway-Smoke-Test“ zeigt, ob die vollständige Gateway-und-Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

Die nachfolgend kuratierten Modelllisten befinden sich in `src/agents/live-model-filter.ts` und
ändern sich im Laufe der Zeit; betrachten Sie die dortigen Arrays als maßgebliche Quelle, nicht diese
Seite.

MiniMax M3 verwendet `minimax/MiniMax-M3` als standardmäßige Provider-/Modellreferenz.

### Ebene 1: Direkte Modellvervollständigung (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle auflisten
  - Mit `getApiKeyForModel` die Modelle auswählen, für die Sie Zugangsdaten besitzen
  - Pro Modell eine kleine Vervollständigung ausführen (und bei Bedarf gezielte Regressionstests)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1` bei direktem Aufruf von Vitest)
  - Setzen Sie `OPENCLAW_LIVE_MODELS=modern`, `small` oder `all` (Alias für `modern`), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, sodass `pnpm test:live` allein weiterhin auf den Gateway-Smoke-Test fokussiert bleibt.
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern` führt die kuratierte Prioritätsliste mit hoher Aussagekraft aus (siehe [Live: Modellmatrix](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` führt die kuratierte Prioritätsliste kleiner Modelle aus
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für `modern`
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (kommagetrennte Positivliste)
  - Lokale Ollama-Ausführungen mit kleinen Modellen verwenden standardmäßig `http://127.0.0.1:11434`; setzen Sie `OPENCLAW_LIVE_OLLAMA_BASE_URL` nur für LAN-, benutzerdefinierte oder Ollama-Cloud-Endpunkte.
  - Moderne/vollständige und kleine Durchläufe verwenden standardmäßig die Länge ihrer kuratierten Liste als Obergrenze; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen Durchlauf des ausgewählten Profils oder eine positive Zahl für eine niedrigere Obergrenze.
  - Vollständige Durchläufe verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` als Zeitlimit für den gesamten direkten Modelltest. Standard: 60 Minuten.
  - Direkte Modellprüfungen werden standardmäßig mit 20-facher Parallelität ausgeführt; setzen Sie zum Überschreiben `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (kommagetrennte Positivliste)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Umgebungs-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um ausschließlich den **Profilspeicher** zu erzwingen
- Zweck:
  - Trennt „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionstests (Beispiel: Wiedergabe der Schlussfolgerung bei OpenAI Responses/Codex Responses und Abläufe mit Tool-Aufrufen)

### Ebene 2: Gateway und Entwicklungsagent-Smoke-Test (was „@openclaw“ tatsächlich ausführt)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein prozessinternes Gateway starten
  - Eine `agent:dev:*`-Sitzung erstellen/aktualisieren (Modellüberschreibung pro Ausführung)
  - Modelle mit Schlüsseln durchlaufen und Folgendes prüfen:
    - „aussagekräftige“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Leseprüfung)
    - optionale zusätzliche Tool-Prüfungen (Ausführungs- und Leseprüfung)
    - OpenAI-Regressionspfade (nur Tool-Aufruf -> Folgeaktion) funktionieren weiterhin
- Prüfdetails (damit Sie Fehler schnell erklären können):
  - `read`-Prüfung: Der Test schreibt eine Nonce-Datei in den Arbeitsbereich und fordert den Agenten auf, sie mit `read` zu lesen und die Nonce zurückzugeben.
  - `exec+read`-Prüfung: Der Test fordert den Agenten auf, mit `exec` eine Nonce in eine temporäre Datei zu schreiben und sie anschließend mit `read` zurückzulesen.
  - Bildprüfung: Der Test hängt eine generierte PNG-Datei an (Katze und zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `test/helpers/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1` bei direktem Aufruf von Vitest)
- Modellauswahl:
  - Standard: die kuratierte Prioritätsliste mit hoher Aussagekraft (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` führt die kuratierte Liste kleiner Modelle durch die vollständige Gateway-und-Agent-Pipeline aus
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für `modern`
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine kommagetrennte Liste), um die Auswahl einzugrenzen
  - Moderne/vollständige und kleine Gateway-Durchläufe verwenden standardmäßig die Länge ihrer kuratierten Liste als Obergrenze; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen ausgewählten Durchlauf oder eine positive Zahl für eine niedrigere Obergrenze.
- Providerauswahl (nicht „alles über OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (kommagetrennte Positivliste)
- Tool- und Bildprüfungen sind in diesem Live-Test immer aktiviert:
  - `read`-Prüfung und `exec+read`-Prüfung (Tool-Belastung)
  - Die Bildprüfung wird ausgeführt, wenn das Modell die Unterstützung von Bildeingaben angibt
  - Ablauf (Übersicht):
    - Der Test erzeugt eine kleine PNG-Datei mit „CAT“ und einem zufälligen Code (`test/helpers/live-image-probe.ts`)
    - Sendet sie über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Das Gateway analysiert Anhänge als `images[]` (`src/gateway/server-methods/agent.ts` und `src/gateway/chat-attachments.ts`)
    - Der eingebettete Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Prüfung: Die Antwort enthält `cat` und den Code (OCR-Toleranz: kleinere Fehler sind zulässig)

<Tip>
Um zu sehen, was Sie auf Ihrem Rechner testen können (einschließlich der exakten `provider/model`-IDs), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: Smoke-Test des CLI-Backends (Claude, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: Die Gateway-und-Agent-Pipeline mithilfe eines lokalen CLI-Backends validieren, ohne Ihre Standardkonfiguration zu verändern.
- Backendspezifische Smoke-Standardeinstellungen befinden sich in der `cli-backend.ts`-Definition des zuständigen Plugins.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1` bei direktem Aufruf von Vitest)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardeinstellungen:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Das Verhalten für Befehl, Argumente und Bilder stammt aus den Metadaten des zuständigen CLI-Backend-Plugins.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt eingefügt). In Docker-Rezepten standardmäßig deaktiviert.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um eine zweite Interaktion zu senden und den Fortsetzungsablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um die Kontinuitätsprüfung Claude Sonnet -> Opus innerhalb derselben Sitzung zu aktivieren, wenn das ausgewählte Modell ein Wechselziel unterstützt. Standardmäßig deaktiviert, auch in Docker-Rezepten.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um die MCP-/Tool-Loopback-Prüfung zu aktivieren. In Docker-Rezepten standardmäßig deaktiviert.

Beispiel:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Kostengünstiger Smoke-Test der Gemini-MCP-Konfiguration:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dabei wird Gemini nicht aufgefordert, eine Antwort zu generieren. Der Test schreibt dieselben System-
einstellungen, die OpenClaw Gemini bereitstellt, und führt anschließend `gemini --debug mcp list` aus, um nachzuweisen, dass ein
gespeicherter `transport: "streamable-http"`-Server in Geminis HTTP-MCP-
Form normalisiert wird und eine Verbindung zu einem lokalen streamfähigen HTTP-MCP-Server herstellen kann.

Docker-Rezept:

```bash
pnpm test:docker:live-cli-backend
```

Docker-Rezepte für einzelne Provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-Smoke-Test des CLI-Backends innerhalb des Docker-Images des Repositorys als Nicht-Root-Benutzer `node` aus.
- Er ermittelt die Metadaten für den CLI-Smoke-Test aus dem zuständigen Plugin und installiert anschließend das passende Linux-CLI-Paket (`@anthropic-ai/claude-code` oder `@google/gemini-cli`) in einem zwischengespeicherten, beschreibbaren Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` ist kein gebündeltes CLI-Backend mehr; verwenden Sie stattdessen `openai/*` mit der Codex-App-Server-Runtime (siehe [Live: Smoke-Test des Codex-App-Server-Testsystems](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portables OAuth für ein Claude-Code-Abonnement, entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder über `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Zunächst wird der direkte Aufruf von `claude -p` in Docker nachgewiesen; anschließend werden zwei Durchläufe des Gateway-CLI-Backends ausgeführt, ohne Umgebungsvariablen für Anthropic-API-Schlüssel beizubehalten. Dieser Abonnement-Testpfad deaktiviert die Claude-MCP-/Tool- und Bildprüfungen standardmäßig, da diese die Nutzungslimits des angemeldeten Abonnements beanspruchen und Anthropic das Abrechnungs- und Ratenbegrenzungsverhalten des Claude Agent SDK bzw. von `claude -p` ohne eine OpenClaw-Veröffentlichung ändern kann.
- Claude und Gemini unterstützen über die obigen Flags dieselben Prüfungen (Textdurchlauf, Bildklassifizierung, Aufruf des MCP-Tools `cron`, Kontinuität beim Modellwechsel), standardmäßig wird jedoch keine dieser Prüfungen ausgeführt – aktivieren Sie sie bei Bedarf jeweils über das entsprechende Flag.

## Live: Erreichbarkeit des APNs-HTTP/2-Proxys

- Test: `src/infra/push-apns-http2.live.test.ts`
- Ziel: einen Tunnel über einen lokalen HTTP-CONNECT-Proxy zum Sandbox-APNs-Endpunkt von Apple aufzubauen, die APNs-HTTP/2-Validierungsanfrage zu senden und sicherzustellen, dass die tatsächliche Antwort `403 InvalidProviderToken` von Apple über den Proxy-Pfad zurückkommt.
- Aktivieren:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionales Zeitlimit:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-Bindungs-Smoke-Test (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den tatsächlichen ACP-Ablauf zur Konversationsbindung mit einem Live-ACP-Agenten zu validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Nachrichtenkanal-Konversation direkt binden
  - eine normale Folgenachricht in derselben Konversation senden
  - prüfen, ob die Folgenachricht im Transkript der gebundenen ACP-Sitzung eintrifft
- Aktivieren:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direkten Aufruf von `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Konversationskontext im Stil einer Slack-Direktnachricht
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (oder `on`/`true`/`yes`), um die Bildprüfung zu erzwingen; jeder andere Wert deaktiviert sie. Sie wird standardmäßig für jeden Agenten außer `opencode` ausgeführt.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Hinweise:
  - Dieser Testpfad verwendet die Gateway-Oberfläche `chat.send` mit ausschließlich Administratoren vorbehaltenen synthetischen Feldern für die Ursprungsroute, damit Tests Nachrichtenkanal-Kontext anhängen können, ohne eine externe Zustellung vorzutäuschen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agentenregistrierung des eingebetteten Plugins `acpx` für den ausgewählten ACP-Testsystem-Agenten.
  - Die Erstellung eines Cron-MCP in einer gebundenen Sitzung erfolgt standardmäßig nach dem Best-Effort-Prinzip, da externe ACP-Testsysteme MCP-Aufrufe abbrechen können, nachdem der Bindungs-/Bildnachweis erfolgreich war; setzen Sie `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, damit diese Cron-Prüfung nach der Bindung strikt ausgeführt wird.

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
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker-Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bindungs-Smoke-Test nacheinander mit den zusammengefassten Live-CLI-Agenten aus: `claude`, `codex` und anschließend `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzugrenzen.
- Er stellt das passende CLI-Authentifizierungsmaterial im Container bereit und installiert anschließend bei Bedarf die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid über `https://app.factory.ai/cli`, `@google/gemini-cli` oder `opencode-ai`). Das ACP-Backend selbst ist das eingebettete Paket `acpx/runtime` aus dem offiziellen Plugin `acpx`.
- Die Droid-Docker-Variante stellt `~/.factory` für Einstellungen bereit, leitet `FACTORY_API_KEY` weiter und benötigt diesen API-Schlüssel, da die lokale Factory-OAuth-/Schlüsselbund-Authentifizierung nicht portabel in den Container übertragen werden kann. Sie verwendet den integrierten Registrierungseintrag `droid exec --output-format acp` von ACPX.
- Die OpenCode-Docker-Variante ist ein strikter Regressions-Testpfad für einen einzelnen Agenten. Sie schreibt ein temporäres Standardmodell `OPENCODE_CONFIG_CONTENT` aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (Standard: `opencode/kimi-k2.6`).
- Direkte Aufrufe der CLI `acpx` dienen nur als manueller Umgehungspfad zum Vergleichen des Verhaltens außerhalb des Gateways. Der Docker-ACP-Bindungs-Smoke-Test prüft das eingebettete Runtime-Backend `acpx` von OpenClaw.

## Live: Smoke-Test des Codex-App-Server-Testsystems

- Ziel: das Plugin-eigene Codex-Testsystem über die normale Gateway-Methode
  `agent` zu validieren:
  - das gebündelte Plugin `codex` laden
  - über `/model <ref> --runtime codex` ein OpenAI-Modell auswählen
  - einen ersten Gateway-Agentendurchlauf mit der angeforderten Denkstufe senden
  - einen zweiten Durchlauf an dieselbe OpenClaw-Sitzung senden und prüfen, ob der Thread des App-Servers
    fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad
    ausführen
  - optional zwei durch Guardian geprüfte Shell-Prüfungen mit erhöhten Berechtigungen ausführen: einen harmlosen
    Befehl, der genehmigt werden sollte, und einen vorgetäuschten Geheimnis-Upload, der
    abgelehnt werden sollte, sodass der Agent nachfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Basismodell des Testsystems: `openai/gpt-5.6-luna`
- Standard für die Auswahl eines neuen OpenAI-API-Schlüssels: `openai/gpt-5.6`
- Standard-Denkstufe: `low`
- Modellüberschreibung: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Überschreibung der Denkstufe: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Aufwandsprüfung für ein vom Standard abweichendes Modell:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- Matrixüberschreibung: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Authentifizierungsmodus: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (Standard) verwendet die
  kopierte Codex-Anmeldung; `api-key` verwendet `OPENAI_API_KEY` über den Codex-App-Server.
- Optionale Bildprüfung: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Optionaler Fortsetzungs-Stresstest: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` fügt
  vier Verlaufsdurchläufe hinzu, schließt das Gateway und den Codex-App-Server anschließend
  dreimal und startet beide neu, wobei dieselbe native Thread-ID und derselbe Konversationsverlauf
  vorausgesetzt werden. Überschreiben Sie die begrenzten Anzahlen mit
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) und
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10).
- Optionaler Fan-out-Stresstest: Setzen Sie `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  und `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12). Das Testsystem startet
  alle untergeordneten Agenten gleichzeitig, wartet auf jeden abgeschlossenen Lauf und prüft jede
  eindeutige Antwort der untergeordneten Agenten sowie die native Thread-Identität.
- Optionaler Compaction-Stresstest: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  erzeugt begrenzte native Tool-Ausgaben, setzt automatische Compaction-Ereignisse voraus,
  prüft die persistierte Compaction-Anzahl und den Abruf verborgener Markierungen, startet
  das Gateway und den physischen Codex-App-Server neu und wiederholt anschließend die Ausgabe- und
  Compaction-Welle. Passen Sie den begrenzten Arbeitsumfang mit
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) und
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-800000) an.
- Vollständiger Direkt-API-Kontext: `OPENCLAW_LIVE_CODEX_HARNESS_FULL_CONTEXT=1` wendet
  den Kontext `922000` und die gesamten Compaction-Limits `700000` an, sendet dichte, begrenzte
  Benutzerdurchläufe, führt pro Welle zwei explizite native Compaction-Prüfpunkte aus und
  fährt nach jedem Prüfpunkt mit späteren Durchläufen fort. Er erfordert
  `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` sowie einen absoluten
  Pfad `OPENCLAW_LIVE_CODEX_HARNESS_MODEL_CATALOG`. Der Katalog muss das
  ausgewählte Modell mit `max_context_window: 922000` bereitstellen, damit Codex die
  Überschreibung nicht wieder auf sein normales Katalogfenster begrenzt. Der gewöhnliche Stresstest
  mit reduziertem Schwellenwert oben behält die strengeren Prüfungen für automatische Compaction und
  die Beibehaltung verborgener Markierungen bei.
- Optionale Prüfung zum Deaktivieren der Schleifenweiterleitung:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- Die angeforderte Denkpräferenz kann dem nächstgelegenen von Codex für dieses Modell angegebenen Aufwand
  zugeordnet werden. Beispielsweise ordnet Luna `minimal` `low` zu.
- Bei bekannten Codex-Katalogmodellen wird dieser genaue native Aufwand automatisch abgeleitet.
  Bei Überschreibungen durch unbekannte Modelle muss der erwartete zugeordnete Aufwand angegeben werden.
- Der Smoke-Test erzwingt Provider/Modell `agentRuntime.id: "codex"`, damit ein defektes Codex-
  Testsystem nicht durch einen unbemerkten Rückfall auf OpenClaw erfolgreich sein kann.
- Authentifizierung: Codex-App-Server-Authentifizierung über die lokale Anmeldung des Codex-Abonnements oder
  `OPENAI_API_KEY`, wenn `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker kann
  `~/.codex/auth.json` und `~/.codex/config.toml` für Abonnementdurchläufe kopieren.

Lokales Rezept:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-codex-harness
```

Neustart- und Verlaufs-Stresstest:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

Fan-out-, Großausgabe-, Compaction- und Neustart-Stresstest:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

Compaction-Stresstest für das vollständige native Eingabebudget `922000` von Codex:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_FULL_CONTEXT=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL_CATALOG=/absolute/path/to/models-api-1m.json \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-terra \
  OPENCLAW_LIVE_CODEX_HARNESS_THINKING=medium \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES=800000 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Native Codex-Matrix für GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

## Live: Wiederholte OpenAI-Compaction

- Ziel: die eingebettete OpenClaw-`openai-responses`-Agentenschleife durch
  mindestens zwei echte automatische Compactions führen und anschließend prüfen, ob eine dauerhafte Markierung erhalten bleibt.
- Test: `src/agents/sessions/agent-session.openai-compaction.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_OPENAI_COMPACTION=1`
- Standardmodell: `gpt-5.6-luna`
- Modellüberschreibung: `OPENCLAW_LIVE_OPENAI_COMPACTION_MODEL=<model>`
- Der normale Belastungsmodus verwendet ein reduziertes clientseitiges Kontextbudget, um mit begrenzten API-Ausgaben denselben
  echten Compaction-Pfad zu erreichen.
- Der Vollkontextmodus setzt das Clientbudget auf `922000` und die Compaction-Reserve auf
  `222000`, sodass die automatische Compaction bei `700000` beginnt. Außerdem ist eine
  beobachtete Provider-Eingabeanzahl oberhalb der Preisgrenze für lange Kontexte von `272000` erforderlich.

Begrenztes Live-Rezept:

```bash
OPENCLAW_LIVE_TEST=1 \
  OPENCLAW_LIVE_OPENAI_COMPACTION=1 \
  pnpm test:live -- src/agents/sessions/agent-session.openai-compaction.live.test.ts
```

Rezept mit vollständigem `922000`-Eingabebudget:

```bash
OPENCLAW_LIVE_TEST=1 \
  OPENCLAW_LIVE_OPENAI_COMPACTION=1 \
  OPENCLAW_LIVE_OPENAI_COMPACTION_FULL=1 \
  OPENCLAW_LIVE_OPENAI_COMPACTION_MODEL=gpt-5.6-terra \
  pnpm test:live -- src/agents/sessions/agent-session.openai-compaction.live.test.ts
```

<Warning>
Der vollständige Modus überschreitet bewusst OpenAIs Preisgrenze für lange Kontexte und
kann mehrere große API-Aufrufe ausführen. Verwenden Sie ihn nur mit ausdrücklicher Ausgabengenehmigung.
</Warning>

Standard für einen neuen OpenAI-API-Schlüssel:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Dieser Nachweis lässt `OPENCLAW_LIVE_GATEWAY_MODELS` ungesetzt, löst das Modell über
die Inferenz-Auswahl-Schnittstelle des neuen Onboardings auf, prüft `openai/gpt-5.6` und
führt anschließend einen echten Gateway-Durchlauf mit diesem aufgelösten Modell aus.

GPT-5.6-Matrix für das eingebettete OpenClaw:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker-Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Er übergibt `OPENAI_API_KEY`, kopiert vorhandene Authentifizierungsdateien der Codex CLI, installiert
  `@openai/codex` in ein beschreibbares, eingebundenes npm-
  Präfix, stellt den Quellbaum bereit und führt dann nur den Live-Test des Codex-Harness aus.
- Docker aktiviert standardmäßig die Image-, MCP/Tool- und Guardian-Prüfungen. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen enger eingegrenzten Debug-
  Durchlauf benötigen.
- Docker verwendet dieselbe explizite Codex-Laufzeitkonfiguration, sodass veraltete Aliasse oder ein OpenClaw-
  Fallback keine Regression des Codex-Harness verbergen können.
- Matrixziele werden nacheinander in einem Container ausgeführt. Das Docker-Skript skaliert sein
  standardmäßiges Zeitlimit von 35 Minuten anhand der Anzahl der Ziele; jedes äußere Shell- oder CI-Zeitlimit muss
  dieselbe Gesamtdauer zulassen. Die kanonische CI führt jedes GPT-5.6-Ziel in einem separaten Shard aus.

### Empfohlene Live-Rezepte

Eng gefasste, explizite Zulassungslisten sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Direktes Profil für kleine Modelle:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Gateway-Profil für kleine Modelle:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama-Cloud-API-Smoke-Test:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Einzelnes Modell, Gateway-Smoke-Test:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Aufrufe über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Direkter Smoke-Test für Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google-Schwerpunkt (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Smoke-Test für adaptives Denken (`qa manual` aus der privaten QA-CLI – erfordert `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` und einen Quellcode-Checkout; siehe [QA-Übersicht](/de/concepts/qa-e2e-automation)):
  - Dynamischer Standard für Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamisches Budget für Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Brücke (Agentenendpunkt im Stil von Cloud Code Assist).
- `google-gemini-cli/...` verwendet die lokale Gemini CLI auf Ihrem Rechner (separate Authentifizierung und Besonderheiten der Tools).
- Gemini API im Vergleich zur Gemini CLI:
  - API: OpenClaw ruft Googles gehostete Gemini API über HTTP auf (API-Schlüssel/Profilauthentifizierung); dies ist, was die meisten Benutzer unter „Gemini“ verstehen.
  - CLI: OpenClaw ruft eine lokale `gemini`-Binärdatei über die Shell auf; sie verfügt über eine eigene Authentifizierung und kann sich anders verhalten (Streaming-/Tool-Unterstützung/Versionsabweichungen).

## Live: Modellmatrix (was abgedeckt wird)

Live ist optional, daher gibt es keine feste „CI-Modellliste“. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (und ihr Alias `all`) führen die kuratierte Prioritätsliste aus `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` in `src/agents/live-model-filter.ts` in dieser Prioritätsreihenfolge aus:

| Provider/Modell                                | Hinweise   |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

Die kuratierte Liste **kleiner Modelle** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) aus `SMALL_LIVE_MODEL_PRIORITY`:

| Provider/Modell               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Hinweise zur modernen Liste:

- Die Provider `codex` und `codex-cli` sind vom standardmäßigen modernen Durchlauf ausgeschlossen (sie decken das Verhalten von CLI-Backend/ACP ab und werden oben separat getestet). `openai/gpt-5.5` selbst wird standardmäßig über das Harness des Codex-App-Servers geleitet; siehe [Live: Smoke-Test des Codex-App-Server-Harness](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` und `xai` führen im modernen Durchlauf nur ihre ausdrücklich kuratierten Modell-IDs aus (keine automatische Erweiterung auf „jedes Modell dieses Providers“).
- Nehmen Sie mindestens ein bildfähiges Modell (Vision-Varianten der Claude-, Gemini- oder OpenAI-Familie usw.) in `OPENCLAW_LIVE_GATEWAY_MODELS` auf, um die Bildprüfung auszuführen.

Führen Sie einen Gateway-Smoke-Test mit Tools und Bildern über eine manuell ausgewählte, providerübergreifende Gruppe aus:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Optionale zusätzliche Abdeckung außerhalb der kuratierten Listen (wünschenswert; wählen Sie ein für „Tools“ geeignetes Modell, das Sie aktiviert haben):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (falls Sie Zugriff haben)
- LM Studio: `lmstudio/...` (lokal; Tool-Aufrufe hängen vom API-Modus ab)

### Aggregatoren / alternative Gateways

Wenn Sie Schlüssel aktiviert haben, können Sie auch darüber testen:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bildunterstützung zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie über Anmeldedaten/Konfiguration verfügen):

- Integriert: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie alle OpenAI-/Anthropic-kompatiblen Proxys (LM Studio, vLLM, LiteLLM usw.)

<Tip>
Codieren Sie nicht „alle Modelle“ fest in der Dokumentation. Maßgeblich ist die Liste, die `discoverModels(...)` auf Ihrem Rechner zurückgibt, zusammen mit den verfügbaren Schlüsseln.
</Tip>

## Anmeldedaten (niemals committen)

Live-Tests ermitteln Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten die Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie dies auf dieselbe Weise wie `openclaw models list` / die Modellauswahl.

- Agentenspezifische Authentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dies ist in den Live-Tests mit „Profilschlüsseln“ gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Veraltetes OAuth-Verzeichnis: `~/.openclaw/credentials/` (wird, falls vorhanden, in das bereitgestellte Live-Ausgangsverzeichnis kopiert, ist jedoch nicht der primäre Speicher für Profilschlüssel)
- Lokale Live-Durchläufe kopieren die aktive Konfiguration (wobei die Überschreibungen `agents.*.workspace` / `agentDir` entfernt werden) und die `auth-profiles.json` jedes Agenten – nicht den übrigen Inhalt des jeweiligen Agentenverzeichnisses, sodass Daten aus `workspace/` und `sandboxes/` niemals in das bereitgestellte Ausgangsverzeichnis gelangen – sowie das veraltete Verzeichnis `credentials/` und unterstützte Authentifizierungsdateien/-verzeichnisse externer CLIs (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) in ein temporäres Test-Ausgangsverzeichnis.

Wenn Sie Umgebungsschlüssel verwenden möchten, exportieren Sie sie vor lokalen Tests oder verwenden Sie die
nachstehenden Docker-Runner mit einem expliziten `OPENCLAW_PROFILE_FILE`.

## Deepgram Live (Audiotranskription)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktivieren: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-Coding-Plan Live

- Test: `extensions/byteplus/live.test.ts`
- Aktivieren: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien Live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Führt die gebündelten comfy-Pfade für Bilder, Videos und `music_generate` aus
  - Überspringt jede Funktion, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an der Übermittlung von comfy-Workflows, am Polling, an Downloads oder an der Plugin-Registrierung

## Live-Bilderzeugung

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Testumgebung: `pnpm test:live:media image`
- Umfang:
  - Listet jedes registrierte Provider-Plugin für die Bildgenerierung auf
  - Verwendet bereits exportierte Provider-Umgebungsvariablen vor der Prüfung
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht überdecken
  - Überspringt Provider ohne verwendbare Authentifizierung/verwendbares Profil/Modell
  - Führt jeden konfigurierten Provider über die gemeinsame Laufzeit für die Bildgenerierung aus:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Bearbeitungsunterstützung deklariert
- Derzeit abgedeckte gebündelte Provider:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Authentifizierung über den Profilspeicher zu erzwingen und ausschließlich umgebungsbasierte Überschreibungen zu ignorieren

Fügen Sie für den ausgelieferten CLI-Pfad einen `infer`-Smoke-Test hinzu, nachdem der Live-Test für Provider/Laufzeit erfolgreich
durchgelaufen ist:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "Minimales flaches Testbild: ein blaues Quadrat auf weißem Hintergrund, ohne Text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dies deckt die Analyse der CLI-Argumente, die Auflösung der Konfiguration/des Standard-Agenten, die Aktivierung gebündelter
Plugins, die gemeinsame Laufzeit für die Bildgenerierung und die Live-Provider-
Anfrage ab. Plugin-Abhängigkeiten müssen vor dem Laden der Laufzeit vorhanden sein.

## Live-Musikgenerierung

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Testumgebung: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen Pfad für gebündelte Provider zur Musikgenerierung
  - Deckt derzeit `fal`, `google`, `minimax` und `openrouter` ab
  - Verwendet bereits exportierte Provider-Umgebungsvariablen vor der Prüfung
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht überdecken
  - Überspringt Provider ohne verwendbare Authentifizierung/verwendbares Profil/Modell
  - Führt beide deklarierten Laufzeitmodi aus, sofern verfügbar:
    - `generate` mit ausschließlich einer Eingabeaufforderung als Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - `comfy` verfügt über eine eigene separate Live-Datei und ist nicht Teil dieses gemeinsamen Durchlaufs
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Authentifizierung über den Profilspeicher zu erzwingen und ausschließlich umgebungsbasierte Überschreibungen zu ignorieren

## Live-Videogenerierung

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Testumgebung: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen Pfad für gebündelte Provider zur Videogenerierung über `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai` hinweg
  - Verwendet standardmäßig den releasesicheren Smoke-Pfad: eine Text-zu-Video-Anfrage pro Provider, eine einsekündige Lobster-Eingabeaufforderung und eine Obergrenze für Vorgänge pro Provider aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, da die providerseitige Warteschlangenlatenz die Release-Dauer dominieren kann; übergeben Sie `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (oder leeren Sie die Ausschlussliste), um ihn explizit auszuführen
  - Verwendet bereits exportierte Provider-Umgebungsvariablen vor der Prüfung
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht überdecken
  - Überspringt Provider ohne verwendbare Authentifizierung/verwendbares Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Legen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` fest, um zusätzlich deklarierte Transformationsmodi auszuführen, sofern verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Durchlauf pufferbasierte lokale Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Durchlauf pufferbasierte lokale Videoeingaben akzeptiert
  - Derzeit deklarierter, aber im gemeinsamen Durchlauf übersprungener `imageToVideo`-Provider:
    - `vydra` (pufferbasierte lokale Bildeingaben werden in diesem Testpfad nicht unterstützt)
  - Providerspezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Diese Datei führt `veo3` Text-zu-Video sowie einen `kling`-Bild-zu-Video-Testpfad aus, der standardmäßig eine Remote-Bild-URL als Testvorrichtung verwendet (zum Überschreiben `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`).
  - Providerspezifische xAI-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Der klassische Fall erzeugt ein quadratisches lokales PNG als erstes Einzelbild, lässt die Geometrie weg, fordert einen einsekündigen Bild-zu-Video-Clip an, fragt den Status bis zum Abschluss ab und überprüft den heruntergeladenen Puffer.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Der 1.5-Fall erzeugt ein lokales PNG als erstes Einzelbild, fordert einen einsekündigen 1080P-Bild-zu-Video-Clip an, fragt den Status bis zum Abschluss ab und überprüft den heruntergeladenen Puffer.
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - `runway` nur, wenn das ausgewählte Modell zu `gen4_aleph` aufgelöst wird
  - Derzeit deklarierte, aber im gemeinsamen Durchlauf übersprungene `videoToVideo`-Provider:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, da diese Pfade derzeit Remote-`http(s)`-Referenz-URLs anstelle pufferbasierter lokaler Eingaben erfordern
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standarddurchlauf einzubeziehen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um die Obergrenze für Vorgänge jedes Providers für einen besonders kurzen Smoke-Test zu reduzieren
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Authentifizierung über den Profilspeicher zu erzwingen und ausschließlich umgebungsbasierte Überschreibungen zu ignorieren

## Live-Testumgebung für Medien

- Befehl: `pnpm test:live:media`
- Einstiegspunkt: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, der `pnpm test:live -- <suite-test-file>` für jede ausgewählte Suite ausführt, damit das Heartbeat- und Ruhemodusverhalten mit anderen `pnpm test:live`-Ausführungen konsistent bleibt.
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bilder, Musik und Videos über einen einzigen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, für die derzeit eine verwendbare Authentifizierung vorhanden ist
- Flags:
  - `--providers <csv>` ist der globale Provider-Filter; `--image-providers` / `--music-providers` / `--video-providers` beschränken einen Filter auf eine Suite
  - `--all-providers` überspringt den authentifizierungsbasierten automatischen Filter
  - `--allow-empty` beendet den Vorgang mit `0`, wenn nach der Filterung keine ausführbaren Provider verbleiben
  - `--quiet` / `--no-quiet` werden an `test:live` weitergegeben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandte Themen

- [Tests](/de/help/testing) – Unit-, Integrations-, QA- und Docker-Suites
