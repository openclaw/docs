---
read_when:
    - Live-Modellmatrix- / CLI-Backend- / ACP- / Media-Provider-Smoke-Tests ausführen
    - Fehlersuche bei der Auflösung von Zugangsdaten für Live-Tests
    - Hinzufügen eines neuen Provider-spezifischen Live-Tests
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Zugangsdaten'
title: 'Testen: Live-Suites'
x-i18n:
    generated_at: "2026-05-02T20:48:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

Den Schnellstart, QA-Runner, Unit-/Integrations-Suites und Docker-Abläufe finden Sie unter
[Testing](/de/help/testing). Diese Seite behandelt die **Live**-Testsuites (mit
Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP und Live-Tests für
Medien-Provider sowie die Handhabung von Zugangsdaten.

## Live: lokale Profil-Smoke-Befehle

Laden Sie `~/.profile` vor Ad-hoc-Live-Prüfungen, damit Provider-Schlüssel und
lokale Tool-Pfade zu Ihrer Shell passen:

```bash
source ~/.profile
```

Sicherer Medien-Smoke-Test:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Sicherer Smoke-Test für Voice-Call-Bereitschaft:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Probelauf, sofern nicht zusätzlich `--yes` vorhanden
ist. Verwenden Sie `--yes` nur, wenn Sie absichtlich einen echten
Benachrichtigungsanruf auslösen möchten. Für Twilio, Telnyx und Plivo erfordert
eine erfolgreiche Bereitschaftsprüfung eine öffentliche Webhook-URL; lokale
Loopback-/private Fallbacks werden absichtlich abgelehnt.

## Live: Capability-Sweep für Android-Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** eines verbundenen Android-Node aufrufen und das Befehlsvertragsverhalten prüfen.
- Umfang:
  - Vorkonditioniertes/manuelles Setup (die Suite installiert/startet/koppelt die App nicht).
  - Befehlsweise Gateway-`node.invoke`-Validierung für den ausgewählten Android-Node.
- Erforderliche Vorbereitung:
  - Android-App ist bereits verbunden und mit dem Gateway gekoppelt.
  - App bleibt im Vordergrund.
  - Berechtigungen/Erfassungseinwilligung sind für die Capabilities erteilt, die erfolgreich sein sollen.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Android-Setupdetails: [Android-App](/de/platforms/android)

## Live: Modell-Smoke-Test (Profil-Schlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ zeigt, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke-Test“ zeigt, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Policy usw.).

### Ebene 1: Direkte Modellvervollständigung (kein Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - Mit `getApiKeyForModel` Modelle auswählen, für die Sie Zugangsdaten haben
  - Pro Modell eine kleine Vervollständigung ausführen (und bei Bedarf gezielte Regressionen)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke-Tests fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern` führt die moderne Allowlist aus (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (kommagetrennte Allowlist)
  - Modern/all-Sweeps verwenden standardmäßig eine kuratierte High-Signal-Obergrenze; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
  - Vollständige Sweeps verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` als Timeout für den gesamten Direktmodelltest. Standard: 60 Minuten.
  - Direktmodell-Probes laufen standardmäßig mit 20-facher Parallelität; setzen Sie `OPENCLAW_LIVE_MODEL_CONCURRENCY`, um dies zu überschreiben.
- Provider-Auswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (kommagetrennte Allowlist)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um ausschließlich den **Profilspeicher** zu erzwingen
- Warum es dies gibt:
  - Trennt „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionen (Beispiel: Reasoning-Replay für OpenAI Responses/Codex Responses + Tool-Call-Abläufe)

### Ebene 2: Gateway + Dev-Agent-Smoke-Test (was „@openclaw“ tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine `agent:dev:*`-Sitzung erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und prüfen:
    - „aussagekräftige“ Antwort (keine Tools)
    - ein echter Tool-Aufruf funktioniert (Lese-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Lese-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiter
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und bittet den Agent, sie zu `read` und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test bittet den Agent, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie anschließend per `read` zurückzulesen.
  - Bild-Probe: Der Test hängt ein generiertes PNG an (cat + zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine kommagetrennte Liste), um einzuschränken
  - Modern/all-Gateway-Sweeps verwenden standardmäßig eine kuratierte High-Signal-Obergrenze; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- Provider-Auswahl („OpenRouter alles“ vermeiden):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (kommagetrennte Allowlist)
- Tool- und Bild-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe läuft, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (übergeordnet):
    - Test generiert ein kleines PNG mit „CAT“ + Zufallscode (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Nutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler erlaubt)

<Tip>
Um zu sehen, was Sie auf Ihrem Computer testen können (und die genauen `provider/model`-IDs), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-Backend-Smoke-Test (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- und Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Backend-spezifische Smoke-Standards befinden sich in der `cli-backend.ts`-Definition des besitzenden Plugins.
- Aktivieren:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standards:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Befehls-/Argument-/Bildverhalten stammt aus den Metadaten des besitzenden CLI-Backend-Plugins.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert). Docker-Rezepte deaktivieren dies standardmäßig, sofern nicht ausdrücklich angefordert.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Ablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um sich für die Claude-Sonnet-zu-Opus-Kontinuitäts-Probe in derselben Sitzung zu entscheiden, wenn das ausgewählte Modell ein Wechselziel unterstützt. Docker-Rezepte deaktivieren dies standardmäßig zugunsten der aggregierten Zuverlässigkeit.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um sich für die MCP-/Tool-Loopback-Probe zu entscheiden. Docker-Rezepte deaktivieren dies standardmäßig, sofern nicht ausdrücklich angefordert.

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Günstiger Gemini-MCP-Konfigurations-Smoke-Test:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dies fordert Gemini nicht auf, eine Antwort zu generieren. Es schreibt dieselben
Systemeinstellungen, die OpenClaw Gemini gibt, und führt dann `gemini --debug mcp list` aus, um nachzuweisen, dass ein
gespeicherter `transport: "streamable-http"`-Server in Geminis HTTP-MCP-Form
normalisiert wird und sich mit einem lokalen streamable-HTTP-MCP-Server verbinden kann.

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
- Er führt den Live-CLI-Backend-Smoke-Test im Repo-Docker-Image als Nicht-Root-Benutzer `node` aus.
- Er löst CLI-Smoke-Metadaten aus dem besitzenden Plugin auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portables Claude-Code-Subscription-OAuth entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es weist zuerst direktes `claude -p` in Docker nach und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Env-Vars beizubehalten. Dieser Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Bild-Probes, weil Claude die Nutzung durch Drittanbieter-Apps derzeit über Extra-Usage-Abrechnung statt über normale Subscription-Planlimits routet.
- Der Live-CLI-Backend-Smoke-Test übt jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini aus: Text-Turn, Bildklassifizierungs-Turn und anschließend MCP-`cron`-Tool-Call, der über die Gateway-CLI verifiziert wird.
- Claudes Standard-Smoke-Test patcht außerdem die Sitzung von Sonnet zu Opus und verifiziert, dass sich die wiederaufgenommene Sitzung weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke-Test (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Conversation-Bind-Flow mit einem Live-ACP-Agent validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Nachrichtenkanal-Konversation an Ort und Stelle binden
  - eine normale Folgenachricht in derselben Konversation senden
  - verifizieren, dass die Folgenachricht im Transcript der gebundenen ACP-Sitzung landet
- Aktivieren:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standards:
  - ACP-Agents in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Konversationskontext im Slack-DM-Stil
  - ACP-Backend: `acpx`
- Overrides:
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
  - Diese Lane verwendet die Gateway-`chat.send`-Oberfläche mit synthetischen, nur für Admins vorgesehenen originating-route-Feldern, damit Tests Nachrichtenkanal-Kontext anhängen können, ohne eine externe Zustellung vorzutäuschen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die eingebaute Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agent.
  - Die MCP-Erstellung für Cron in gebundenen Sitzungen erfolgt standardmäßig nach Best-Effort, weil externe ACP-Harnesses MCP-Aufrufe abbrechen können, nachdem der Bind-/Image-Nachweis bestanden wurde; setzen Sie `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, um diese Cron-Probe nach dem Binding strikt zu machen.

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
- Standardmäßig führt er den ACP-Bind-Smoke-Test der Reihe nach gegen die aggregierten Live-CLI-Agents aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzugrenzen.
- Er lädt `~/.profile`, stellt das passende CLI-Authentifizierungsmaterial im Container bereit und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid über `https://app.factory.ai/cli`, `@google/gemini-cli` oder `opencode-ai`), falls sie fehlt. Das ACP-Backend selbst ist das eingebettete Paket `acpx/runtime` aus dem offiziellen `acpx`-Plugin.
- Die Droid-Docker-Variante stellt `~/.factory` für Einstellungen bereit, leitet `FACTORY_API_KEY` weiter und erfordert diesen API-Schlüssel, weil lokale Factory-OAuth-/Keyring-Authentifizierung nicht portabel in den Container ist. Sie verwendet den eingebauten ACPX-Registry-Eintrag `droid exec --output-format acp`.
- Die OpenCode-Docker-Variante ist eine strikte Regressions-Lane für einen einzelnen Agent. Sie schreibt nach dem Laden von `~/.profile` ein temporäres `OPENCODE_CONFIG_CONTENT`-Standardmodell aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (Standard `opencode/kimi-k2.6`), und `pnpm test:docker:live-acp-bind:opencode` erfordert ein gebundenes Assistant-Transcript, anstatt den generischen Skip nach dem Binding zu akzeptieren.
- Direkte `acpx`-CLI-Aufrufe sind nur ein manueller/Workaround-Pfad zum Vergleichen des Verhaltens außerhalb des Gateway. Der Docker-ACP-Bind-Smoke-Test übt OpenClaws eingebettetes `acpx`-Runtime-Backend aus.

## Live: Smoke-Test für den Codex-App-Server-Harness

- Ziel: den Plugin-eigenen Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte `codex`-Plugin laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `openai/gpt-5.5` mit erzwungenem Codex-Harness senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad
    ausführen
  - optional zwei von Guardian geprüfte eskalierte Shell-Probes ausführen: einen harmlosen
    Befehl, der genehmigt werden sollte, und einen Fake-Secret-Upload, der abgelehnt werden sollte,
    sodass der Agent zurückfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `openai/gpt-5.5`
- Optionale Image-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoke-Test setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein defekter Codex-
  Harness nicht durch stilles Zurückfallen auf PI bestehen kann.
- Authentifizierung: Codex-App-Server-Authentifizierung aus dem lokalen Codex-Abonnement-Login. Docker-
  Smokes können außerdem `OPENAI_API_KEY` für Nicht-Codex-Probes bereitstellen, falls zutreffend,
  plus optional kopierte `~/.codex/auth.json` und `~/.codex/config.toml`.

Lokales Rezept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker-Hinweise:

- Der Docker-Runner befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Er lädt das gemountete `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert vorhandene Codex-CLI-
  Authentifizierungsdateien, installiert `@openai/codex` in ein beschreibbares gemountetes npm-
  Prefix, stellt den Quellbaum bereit und führt dann nur den Codex-Harness-Live-Test aus.
- Docker aktiviert die Image-, MCP-/Tool- und Guardian-Probes standardmäßig. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen engeren Debug-
  Lauf benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, damit Legacy-Aliasse oder PI-Fallback eine Codex-Harness-
  Regression nicht verbergen können.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (kein Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke-Test:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool Calling über mehrere Provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Smoke-Test für adaptives Denken:
  - Wenn lokale Schlüssel im Shell-Profil liegen: `source ~/.profile`
  - Dynamischer Standard für Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamisches Budget für Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Agent-Endpunkt im Cloud-Code-Assist-Stil).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrer Maschine (separate Authentifizierung + Tooling-Eigenheiten).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Schlüssel / Profil-Authentifizierung); das meinen die meisten Benutzer mit „Gemini“.
  - CLI: OpenClaw führt lokal ein `gemini`-Binary per Shell aus; es hat seine eigene Authentifizierung und kann sich anders verhalten (Streaming-/Tool-Unterstützung/Versionsversatz).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwicklungsmaschine mit Schlüsseln abgedeckt werden sollten.

### Moderner Smoke-Satz (Tool Calling + Image)

Dies ist der Lauf mit „gängigen Modellen“, von dem wir erwarten, dass er funktionsfähig bleibt:

- OpenAI (nicht Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke-Test mit Tools + Image ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (hilfreich):

- xAI: `xai/grok-4.3` (oder neuestes verfügbares)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell aus, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool Calling hängt vom API-Modus ab)

### Vision: Image senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein image-fähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude-/Gemini-/OpenAI-Varianten mit Vision-Fähigkeit usw.), um die Image-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie Schlüssel aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Image-Fähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Credentials/Konfiguration haben):

- Eingebaut: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API), plus jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

<Tip>
Codieren Sie „alle Modelle“ nicht fest in der Dokumentation. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrer Maschine zurückgibt, plus die jeweils verfügbaren Schlüssel.
</Tip>

## Credentials (niemals committen)

Live-Tests finden Credentials auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Keys finden.
- Wenn ein Live-Test „no creds“ meldet, debuggen Sie auf dieselbe Weise, wie Sie `openclaw models list` / die Modellauswahl debuggen würden.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist in den Live-Tests mit „profile keys“ gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Verzeichnis für Legacy-Zustand: `~/.openclaw/credentials/` (wird, falls vorhanden, in das gestagte Live-Home kopiert, ist aber nicht der Hauptspeicher für Profil-Keys)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, die `auth-profiles.json`-Dateien pro Agent, das Legacy-Verzeichnis `credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; gestagte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfadüberschreibungen für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht auf Ihrem echten Host-Workspace laufen.

Wenn Sie sich auf Env-Keys verlassen möchten (z. B. aus Ihrer `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus, oder verwenden Sie die untenstehenden Docker-Runner (sie können `~/.profile` in den Container mounten).

## Deepgram live (Audiotranskription)

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
  - Übt die gebündelten comfy-Pfade für Bild, Video und `music_generate` aus
  - Überspringt jede Fähigkeit, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Listet jeden registrierten Bildgenerierungs-Provider-Plugin auf
  - Lädt fehlende Provider-Env-Vars vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth-/Profil-/Modellkonfiguration
  - Führt jeden konfigurierten Provider durch die gemeinsame Bildgenerierungs-Runtime:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Edit-Unterstützung deklariert
- Derzeit abgedeckte gebündelte Provider:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Optionale Einschränkung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profil-Speicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

Fügen Sie für den ausgelieferten CLI-Pfad einen `infer`-Smoke hinzu, nachdem der Provider-/Runtime-Live-Test bestanden hat:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dies deckt CLI-Argumentparsing, Konfigurations-/Default-Agent-Auflösung, Aktivierung gebündelter Plugins, die gemeinsame Bildgenerierungs-Runtime und die Live-Provider-Anfrage ab. Plugin-Abhängigkeiten müssen vor dem Laden der Runtime vorhanden sein.

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Übt den gemeinsamen gebündelten Musikgenerierungs-Provider-Pfad aus
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Env-Vars vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth-/Profil-/Modellkonfiguration
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit reiner Prompt-Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Einschränkung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profil-Speicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Übt den gemeinsamen gebündelten Videogenerierungs-Provider-Pfad aus
  - Verwendet standardmäßig den releasesicheren Smoke-Pfad: Nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Lobster-Prompt und eine Operationsobergrenze pro Provider aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil providerseitige Warteschlangenlatenz die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um ihn explizit auszuführen
  - Lädt Provider-Env-Vars vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth-/Profil-/Modellkonfiguration
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um außerdem deklarierte Transformationsmodi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale Bilddateieingaben mit Buffer-Unterstützung akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale Videodateieingaben mit Buffer-Unterstützung akzeptiert
  - Derzeit deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Diese Datei führt `veo3` Text-zu-Video sowie eine `kling`-Lane aus, die standardmäßig ein Remote-Bild-URL-Fixture verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - `runway` nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Derzeit deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Remote-`http(s)`- / MP4-Referenz-URLs erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale Eingaben mit Buffer-Unterstützung verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Lane org-spezifische Zugriffsgarantien für Video-Inpaint/Remix fehlen
- Optionale Einschränkung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standardsweep einzubeziehen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um die Operationsobergrenze pro Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profil-Speicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

## Medien-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Env-Vars automatisch aus `~/.profile`
  - Beschränkt jede Suite standardmäßig automatisch auf Provider, die derzeit über nutzbare Auth verfügen
  - Verwendet `scripts/test-live.mjs` wieder, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandt

- [Testing](/de/help/testing) — Unit-, Integrations-, QA- und Docker-Suites
