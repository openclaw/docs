---
read_when:
    - Live-Smoke-Tests für Modellmatrix / CLI-Backend / ACP / Media-Provider ausführen
    - Debuggen der Anmeldedatenauflösung für Live-Tests
    - Einen neuen Provider-spezifischen Live-Test hinzufügen
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Zugangsdaten'
title: 'Tests: Live-Test-Suiten'
x-i18n:
    generated_at: "2026-06-27T17:35:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Für den Schnellstart, QA-Runner, Unit-/Integrationssuiten und Docker-Flows siehe
[Testing](/de/help/testing). Diese Seite behandelt die **Live**-Testsuiten (mit Netzwerkzugriff):
Modellmatrix, CLI-Backends, ACP und Live-Tests für Medien-Provider sowie
den Umgang mit Anmeldedaten.

## Live: lokale Smoke-Befehle

Exportieren Sie vor Ad-hoc-Live-Prüfungen den benötigten Provider-Schlüssel in
die Prozessumgebung.

Sicherer Medien-Smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Sicherer Bereitschafts-Smoke für Sprachanrufe:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Probelauf, sofern nicht zusätzlich `--yes` vorhanden
ist. Verwenden Sie `--yes` nur, wenn Sie absichtlich einen echten Benachrichtigungsanruf
auslösen möchten. Für Twilio, Telnyx und Plivo erfordert eine erfolgreiche
Bereitschaftsprüfung eine öffentliche Webhook-URL; rein lokale loopback/private
Fallbacks werden absichtlich abgelehnt.

## Live: Capability-Sweep für Android-Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Node aufrufen und das Verhalten des Befehlsvertrags prüfen.
- Umfang:
  - Vorbereitete/manuelle Einrichtung (die Suite installiert, startet oder koppelt die App nicht).
  - Gateway-Validierung per Befehl über `node.invoke` für den ausgewählten Android-Node.
- Erforderliche Vorbereitung:
  - Android-App ist bereits mit dem Gateway verbunden und gekoppelt.
  - App bleibt im Vordergrund.
  - Berechtigungen/Erfassungseinwilligung sind für die Capabilities erteilt, die erfolgreich sein sollen.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android-App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ zeigt, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ zeigt, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modellvervollständigung (kein Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Anmeldedaten haben
  - Pro Modell eine kleine Vervollständigung ausführen (und bei Bedarf gezielte Regressionen)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern`, `small` oder `all` (Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modelle auswählen:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small`, um die eingeschränkte Allowlist kleiner Modelle auszuführen (Qwen 8B/9B lokal-kompatible Routen, Ollama Gemma, OpenRouter Qwen/GLM und Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (kommagetrennte Allowlist)
  - Lokale Ollama-Läufe mit kleinen Modellen verwenden standardmäßig `http://127.0.0.1:11434`; setzen Sie `OPENCLAW_LIVE_OLLAMA_BASE_URL` nur für LAN-, benutzerdefinierte oder Ollama-Cloud-Endpunkte.
  - Modern/all- und Small-Sweeps verwenden standardmäßig ihre kuratierten Obergrenzen; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen Sweep der ausgewählten Profile oder eine positive Zahl für eine kleinere Obergrenze.
  - Vollständige Sweeps verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` als Timeout für den gesamten Direktmodelltest. Standard: 60 Minuten.
  - Direktmodell-Probes laufen standardmäßig mit 20-facher Parallelität; setzen Sie `OPENCLAW_LIVE_MODEL_CONCURRENCY`, um dies zu überschreiben.
- Provider auswählen:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (kommagetrennte Allowlist)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um ausschließlich den **Profilspeicher** zu erzwingen
- Warum das existiert:
  - Trennt „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionen (Beispiel: Reasoning-Replay und Tool-Call-Flows für OpenAI Responses/Codex Responses)

### Ebene 2: Gateway + Dev-Agent-Smoke (was „@openclaw“ tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine `agent:dev:*`-Sitzung erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und prüfen:
    - „aussagekräftige“ Antwort (keine Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agent auf, sie per `read` zu lesen und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agent auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie anschließend per `read` zurückzulesen.
  - Bild-Probe: Der Test hängt ein generiertes PNG an (Katze + zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `test/helpers/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modelle auswählen:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`, um dieselbe eingeschränkte Allowlist kleiner Modelle durch die vollständige Gateway+Agent-Pipeline laufen zu lassen
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine kommagetrennte Liste), um einzugrenzen
  - Modern/all- und Small-Gateway-Sweeps verwenden standardmäßig ihre kuratierten Obergrenzen; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen ausgewählten Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- Provider auswählen („OpenRouter alles“ vermeiden):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (kommagetrennte Allowlist)
- Tool- und Bild-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe läuft, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Flow (auf hoher Ebene):
    - Test erzeugt ein kleines PNG mit „CAT“ + Zufallscode (`test/helpers/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Nutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleinere Fehler erlaubt)

<Tip>
Um zu sehen, was Sie auf Ihrem Rechner testen können (und die genauen `provider/model`-IDs), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-Backend-Smoke (Claude, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: Die Gateway- und Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Backend-spezifische Smoke-Standards befinden sich in der `cli-backend.ts`-Definition der zuständigen Erweiterung.
- Aktivieren:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standards:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Befehls-/Argument-/Bildverhalten stammt aus den Metadaten des zuständigen CLI-Backend-Plugins.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert). Docker-Rezepte deaktivieren dies standardmäßig, sofern es nicht ausdrücklich angefordert wird.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um die Kontinuitäts-Probe Claude Sonnet -> Opus in derselben Sitzung zu aktivieren, wenn das ausgewählte Modell ein Wechselziel unterstützt. Docker-Rezepte deaktivieren dies standardmäßig zugunsten aggregierter Zuverlässigkeit.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um die MCP/Tool-loopback-Probe zu aktivieren. Docker-Rezepte deaktivieren dies standardmäßig, sofern es nicht ausdrücklich angefordert wird.

Beispiel:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Günstiger Gemini-MCP-Konfigurations-Smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dies fordert Gemini nicht auf, eine Antwort zu generieren. Es schreibt dieselben
Systemeinstellungen, die OpenClaw Gemini gibt, und führt dann `gemini --debug mcp list`
aus, um nachzuweisen, dass ein gespeicherter `transport: "streamable-http"`-Server
in Geminis HTTP-MCP-Form normalisiert wird und eine Verbindung zu einem lokalen
streamable-HTTP-MCP-Server herstellen kann.

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
- Er führt den Live-CLI-Backend-Smoke im Repo-Docker-Image als Nicht-Root-Benutzer `node` aus.
- Er löst CLI-Smoke-Metadaten aus der zuständigen Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code` oder `@google/gemini-cli`) in ein gecachtes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude-Code-Subscription-OAuth entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es weist zuerst direktes `claude -p` in Docker nach und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Env-Vars beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP/Tool- und Bild-Probes, weil Claude die Nutzung durch Drittanbieter-Apps derzeit über zusätzliche Nutzungsabrechnung statt über normale Subscription-Plan-Limits routet.
- Der Live-CLI-Backend-Smoke übt jetzt denselben End-to-End-Flow für Claude und Gemini aus: Text-Turn, Bildklassifizierungs-Turn und dann MCP-`cron`-Tool-Call, der über die Gateway-CLI verifiziert wird.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass sich die wiederaufgenommene Sitzung weiterhin an eine frühere Notiz erinnert.

## Live: APNs-HTTP/2-Proxy-Erreichbarkeit

- Test: `src/infra/push-apns-http2.live.test.ts`
- Ziel: Durch einen lokalen HTTP-CONNECT-Proxy zum Sandbox-APNs-Endpunkt von Apple tunneln, die APNs-HTTP/2-Validierungsanfrage senden und prüfen, dass Apples echte Antwort `403 InvalidProviderToken` über den Proxy-Pfad zurückkommt.
- Aktivieren:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionales Timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Conversation-Bind-Ablauf mit einem Live-ACP-Agent validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation direkt binden
  - ein normales Follow-up in derselben Konversation senden
  - prüfen, dass das Follow-up im Transkript der gebundenen ACP-Session landet
- Aktivieren:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agents in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Channel: Konversationskontext im Stil einer Slack-DM
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit admin-only synthetischen Originating-Route-Feldern, damit Tests Message-Channel-Kontext anhängen können, ohne eine externe Zustellung vorzutäuschen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die eingebaute Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agent.
  - Die Erstellung von Bound-Session-Cron-MCP erfolgt standardmäßig nach bestem Bemühen, weil externe ACP-Harnesses MCP-Aufrufe abbrechen können, nachdem der Bind-/Image-Nachweis bestanden wurde; setzen Sie `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, um diese Post-Bind-Cron-Prüfung strikt zu machen.

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

Docker-Rezepte für einzelne Agents:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker-Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen die aggregierten Live-CLI-Agents aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzugrenzen.
- Er stellt das passende CLI-Auth-Material im Container bereit und installiert dann bei Bedarf die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid über `https://app.factory.ai/cli`, `@google/gemini-cli` oder `opencode-ai`). Das ACP-Backend selbst ist das eingebettete Paket `acpx/runtime` aus dem offiziellen `acpx`-Plugin.
- Die Droid-Docker-Variante stellt `~/.factory` für Einstellungen bereit, leitet `FACTORY_API_KEY` weiter und erfordert diesen API-Key, weil lokale Factory-OAuth-/Keyring-Auth nicht portabel in den Container ist. Sie verwendet den eingebauten Registry-Eintrag `droid exec --output-format acp` von ACPX.
- Die OpenCode-Docker-Variante ist eine strikte Single-Agent-Regressions-Lane. Sie schreibt ein temporäres `OPENCODE_CONFIG_CONTENT`-Standardmodell aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (Standard `opencode/kimi-k2.6`), und `pnpm test:docker:live-acp-bind:opencode` verlangt ein gebundenes Assistant-Transkript, anstatt den generischen Post-Bind-Skip zu akzeptieren.
- Direkte `acpx`-CLI-Aufrufe sind nur ein manueller/Workaround-Pfad zum Vergleichen des Verhaltens außerhalb des Gateway. Der Docker-ACP-Bind-Smoke testet das eingebettete `acpx`-Runtime-Backend von OpenClaw.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: den Plugin-eigenen Codex-Harness über die normale Gateway-Methode
  `agent` validieren:
  - das gebündelte `codex`-Plugin laden
  - `openai/gpt-5.5` auswählen, wodurch OpenAI-Agent-Turns standardmäßig über Codex geroutet werden
  - einen ersten Gateway-Agent-Turn an `openai/gpt-5.5` mit ausgewähltem Codex-Harness senden
  - einen zweiten Turn an dieselbe OpenClaw-Session senden und prüfen, dass der App-Server-Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Command-Pfad ausführen
  - optional zwei von Guardian geprüfte, eskalierte Shell-Prüfungen ausführen: einen harmlosen Command, der genehmigt werden sollte, und einen Fake-Secret-Upload, der abgelehnt werden sollte, sodass der Agent zurückfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `openai/gpt-5.5`
- Optionale Image-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoke erzwingt Provider/Modell `agentRuntime.id: "codex"`, sodass ein defekter Codex-Harness nicht bestehen kann, indem er stillschweigend auf OpenClaw zurückfällt.
- Auth: Codex-App-Server-Auth aus dem lokalen Codex-Subscription-Login. Docker-Smokes können außerdem `OPENAI_API_KEY` für Nicht-Codex-Prüfungen bereitstellen, sofern anwendbar, plus optional kopierte `~/.codex/auth.json` und `~/.codex/config.toml`.

Lokales Rezept:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-codex-harness
```

Docker-Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Er übergibt `OPENAI_API_KEY`, kopiert vorhandene Codex-CLI-Auth-Dateien, installiert `@openai/codex` in ein beschreibbar gemountetes npm-Präfix, stellt den Quellbaum bereit und führt dann nur den Codex-Harness-Live-Test aus.
- Docker aktiviert die Image-, MCP-/Tool- und Guardian-Prüfungen standardmäßig. Setzen Sie `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen engeren Debug-Lauf benötigen.
- Docker verwendet dieselbe explizite Codex-Runtime-Konfiguration, sodass Legacy-Aliasse oder OpenClaw-Fallback eine Codex-Harness-Regression nicht verdecken können.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Direktes Small-Model-Profil:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Small-Model-Gateway-Profil:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama-Cloud-API-Smoke:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Direkter Z.AI Coding Plan GLM-5.2-Smoke:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google-Fokus (Gemini-API-Key + Antigravity):
  - Gemini (API-Key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Smoke für adaptives Denken:
  - Gemini 3 dynamischer Standard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisches Budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini API (API-Key).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Agent-Endpunkt im Cloud-Code-Assist-Stil).
- `google-gemini-cli/...` verwendet die lokale Gemini CLI auf Ihrem Rechner (separate Auth + Tooling-Eigenheiten).
- Gemini API vs. Gemini CLI:
  - API: OpenClaw ruft die gehostete Gemini API von Google per HTTP auf (API-Key / Profil-Auth); das meinen die meisten Benutzer mit „Gemini“.
  - CLI: OpenClaw führt ein lokales `gemini`-Binary über die Shell aus; es hat eine eigene Auth und kann sich anders verhalten (Streaming-/Tool-Unterstützung/Versionsdrift).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwicklungsmaschine mit Keys abgedeckt werden sollten.

### Modernes Smoke-Set (Tool Calling + Image)

Dies ist der Lauf für „gängige Modelle“, von dem wir erwarten, dass er funktionsfähig bleibt:

- OpenAI (Nicht-Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (allgemeine API) oder `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Gateway-Smoke mit Tools + Image ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie aus:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (allgemeine API) oder `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Optionale zusätzliche Abdeckung (nützlich):

- xAI: `xai/grok-4.3` (oder das neueste verfügbare Modell)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell aus, das bei Ihnen aktiviert ist)
- Cerebras: `cerebras/`… (wenn Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool Calling hängt vom API-Modus ab)

### Vision: Image senden (Attachment → multimodale Message)

Nehmen Sie mindestens ein image-fähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude-/Gemini-/OpenAI-Vision-fähige Varianten usw.), um die Image-Prüfung auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie Keys aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Image-Fähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Zugangsdaten/Konfiguration haben):

- Integriert: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

<Tip>
Codieren Sie „alle Modelle“ nicht fest in der Dokumentation. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrem Rechner zurückgibt, plus alle verfügbaren Schlüssel.
</Tip>

## Anmeldedaten (niemals committen)

Live-Tests ermitteln Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Konsequenzen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie genauso, wie Sie `openclaw models list` / die Modellauswahl debuggen würden.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist in den Live-Tests mit „Profilschlüssel“ gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-Zustandsverzeichnis: `~/.openclaw/credentials/` (wird, falls vorhanden, in das gestagte Live-Home kopiert, ist aber nicht der primäre Speicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; gestagte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfadüberschreibungen für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes von Ihrem echten Host-Workspace fernbleiben.

Wenn Sie sich auf Env-Schlüssel verlassen möchten, exportieren Sie sie vor lokalen Tests oder verwenden Sie die
untenstehenden Docker-Runner mit einer expliziten `OPENCLAW_PROFILE_FILE`.

## Deepgram live (Audio-Transkription)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktivieren: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-Coding-Plan live

- Test: `extensions/byteplus/live.test.ts`
- Aktivieren: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Übt die gebündelten comfy-Pfade für Bild, Video und `music_generate`
  - Überspringt jede Fähigkeit, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Listet jedes registrierte Bildgenerierungs-Provider-Plugin auf
  - Verwendet bereits exportierte Provider-Env-Vars vor dem Probing
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Auth/Profile/Modell
  - Führt jeden konfigurierten Provider durch die gemeinsame Bildgenerierungs-Runtime:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Edit-Unterstützung deklariert
- Aktuell abgedeckte gebündelte Provider:
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth über den Profilspeicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

Fügen Sie für den ausgelieferten CLI-Pfad einen `infer`-Smoke hinzu, nachdem der Provider-/Runtime-Live-Test
bestanden hat:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dies deckt CLI-Argument-Parsing, Konfigurations-/Standard-Agent-Auflösung, Aktivierung gebündelter
Plugins, die gemeinsame Bildgenerierungs-Runtime und die Live-Provider-
Anfrage ab. Plugin-Abhängigkeiten müssen vor dem Laden der Runtime vorhanden sein.

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Übt den gemeinsamen gebündelten Musikgenerierungs-Provider-Pfad
  - Deckt aktuell Google und MiniMax ab
  - Verwendet bereits exportierte Provider-Env-Vars vor dem Probing
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Auth/Profile/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit nur Prompt-Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth über den Profilspeicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Übt den gemeinsamen gebündelten Videogenerierungs-Provider-Pfad
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: Nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein Ein-Sekunden-Hummer-Prompt und ein Operationslimit pro Provider aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil die Queue-Latenz auf Provider-Seite die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um ihn explizit auszuführen
  - Verwendet bereits exportierte Provider-Env-Vars vor dem Probing
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Auth/Profile/Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um auch deklarierte Transformationsmodi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale Bildeingabe per Buffer akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale Videoeingabe per Buffer akzeptiert
  - Aktuelle deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil gebündeltes `veo3` nur Text unterstützt und gebündeltes `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Diese Datei führt `veo3` Text-zu-Video plus eine `kling`-Lane aus, die standardmäßig ein Remote-Bild-URL-Fixture verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - `runway` nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuelle deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade aktuell Remote-`http(s)`-/MP4-Referenz-URLs erfordern
    - `google`, weil die aktuelle gemeinsame Gemini/Veo-Lane lokale Eingabe per Buffer verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Lane org-spezifische Garantien für Video-Edit-Zugriff fehlen
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep einzubeziehen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit je Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth über den Profilspeicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

## Medien-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Verwendet bereits exportierte Provider-Env-Vars
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die aktuell verwendbare Auth haben
  - Verwendet `scripts/test-live.mjs` wieder, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandt

- [Tests](/de/help/testing) - Unit-, Integrations-, QA- und Docker-Suites
