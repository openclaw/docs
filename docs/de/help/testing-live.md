---
read_when:
    - Ausführen von Live-Smokes für Modellmatrix / CLI-Backend / ACP / Medien-Provider
    - Debuggen der Auflösung von Zugangsdaten für Live-Tests
    - Hinzufügen eines neuen provider-spezifischen Live-Tests
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Zugangsdaten'
title: 'Testen: Live-Suites'
x-i18n:
    generated_at: "2026-04-26T11:31:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

Für Schnellstart, QA-Runner, Unit-/Integrations-Suites und Docker-Abläufe siehe
[Testing](/de/help/testing). Diese Seite behandelt die **Live**-Tests (mit Netzwerkzugriff):
Modellmatrix, CLI-Backends, ACP und Live-Tests für Medien-Provider sowie den Umgang mit Zugangsdaten.

## Live: lokale Profil-Smoke-Befehle

Laden Sie `~/.profile` vor ad-hoc Live-Prüfungen, damit Provider-Schlüssel und lokale Tool-
Pfade Ihrer Shell entsprechen:

```bash
source ~/.profile
```

Sicherer Medien-Smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Sicherer Smoke für Voice-Call-Bereitschaft:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Dry Run, solange `--yes` nicht ebenfalls vorhanden ist. Verwenden Sie `--yes` nur,
wenn Sie absichtlich einen echten Benachrichtigungsanruf auslösen möchten. Für Twilio, Telnyx und
Plivo erfordert eine erfolgreiche Bereitschaftsprüfung eine öffentliche Webhook-URL; lokale
local loopback-/private Fallbacks werden absichtlich abgelehnt.

## Live: Sweep der Android-Node-Fähigkeiten

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** einer verbundenen Android-Node aufrufen und das Verhalten des Befehlsvertrags validieren.
- Umfang:
  - Vorgegebene/manuelle Einrichtung (die Suite installiert/startet/koppelt die App nicht).
  - Validierung von Gateway-`node.invoke` pro Befehl für die ausgewählte Android-Node.
- Erforderliche Vorab-Einrichtung:
  - Android-App ist bereits mit dem Gateway verbunden und gekoppelt.
  - App bleibt im Vordergrund.
  - Berechtigungen/Einverständnis zur Erfassung wurden für die Fähigkeiten erteilt, bei denen Sie einen erfolgreichen Test erwarten.
- Optionale Überschreibungen des Ziels:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zum Android-Setup: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit Fehler isoliert werden können:

- „Direct model“ sagt uns, ob Provider/Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway smoke“ sagt uns, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - Mit `getApiKeyForModel` Modelle auswählen, für die Sie Zugangsdaten haben
  - Pro Modell eine kleine Completion ausführen (und bei Bedarf gezielte Regressionen)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (durch Kommas getrennte Allowlist)
  - Moderne/All-Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signalwert; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
  - Vollständige Sweeps verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` als Timeout für den gesamten Direct-Model-Test. Standard: 60 Minuten.
  - Direct-Model-Probes laufen standardmäßig mit 20-facher Parallelität; zum Überschreiben `OPENCLAW_LIVE_MODEL_CONCURRENCY` setzen.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (durch Kommas getrennte Allowlist)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profilspeicher zu erzwingen
- Zweck:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI Responses/Codex Responses mit Reasoning-Replay + Tool-Call-Abläufen)

### Ebene 2: Gateway + Dev-Agent-Smoke (was „@openclaw“ tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modellüberschreibung pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und validieren:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Folgeaktion) funktionieren weiter
- Details zu den Probes (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und bittet den Agent, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agent auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann wieder zu `read`en.
  - Bild-Probe: Der Test hängt ein erzeugtes PNG an (Katze + zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder kommagetrennte Liste) setzen, um einzugrenzen
  - Moderne/All-Gateway-Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signalwert; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- Providerauswahl (vermeidet „OpenRouter alles“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (durch Kommas getrennte Allowlist)
- Tool- + Bild-Probes sind in diesem Live-Test immer aktiv:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe läuft, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (vereinfacht):
    - Der Test erzeugt ein kleines PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleinere Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrem System testen können (und die genauen `provider/model`-IDs), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: Validierung der Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend, ohne Ihre Standardkonfiguration anzufassen.
- Backend-spezifische Smoke-Standards liegen zusammen mit der Definition `cli-backend.ts` der besitzenden Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/Modell: `claude-cli/claude-sonnet-4-6`
  - Verhalten für Befehl/Args/Bild stammt aus den Metadaten des Plugins des besitzenden CLI-Backends.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert). Docker-Rezepte haben dies standardmäßig deaktiviert, sofern nicht ausdrücklich angefordert.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt über Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Durchlauf zu senden und den Resume-Ablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um die Sonnet→Opus-Probe für dieselbe Sitzung zu aktivieren, wenn das ausgewählte Modell ein Wechselziel unterstützt. Docker-Rezepte haben dies standardmäßig für aggregierte Zuverlässigkeit deaktiviert.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um die MCP-/Tool-Loopback-Probe zu aktivieren. Docker-Rezepte haben dies standardmäßig deaktiviert, sofern nicht ausdrücklich angefordert.

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Günstiger Gemini-MCP-Konfigurations-Smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dies veranlasst Gemini nicht, eine Antwort zu erzeugen. Es schreibt dieselben Systemeinstellungen,
die OpenClaw an Gemini weitergibt, und führt dann `gemini --debug mcp list` aus, um zu belegen, dass ein gespeicherter
Server mit `transport: "streamable-http"` in die HTTP-MCP-Form von Gemini normalisiert wird und sich mit einem lokalen Streamable-HTTP-MCP-Server verbinden kann.

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

- Der Docker-Runner liegt unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als Nicht-Root-Benutzer `node` aus.
- Er löst Smoke-Metadaten der CLI aus der besitzenden Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable OAuth für Claude Code subscription über entweder `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es prüft zuerst direkt `claude -p` in Docker und führt dann zwei Durchläufe des Gateway-CLI-Backends aus, ohne Env-Variablen mit Anthropic-API-Schlüsseln beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Bild-Probes, weil Claude die Nutzung durch Drittanbieter-Apps derzeit über zusätzliche Nutzungsabrechnung statt über normale Limits des Abonnementplans abrechnet.
- Der Live-CLI-Backend-Smoke übt jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini aus: Text-Durchlauf, Bildklassifizierungs-Durchlauf, dann MCP-`cron`-Tool-Call, verifiziert über die Gateway-CLI.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass sich die fortgesetzte Sitzung weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Konversations-Bind-Ablauf mit einem Live-ACP-Agent validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation direkt binden
  - eine normale Folgeaktion in derselben Konversation senden
  - verifizieren, dass die Folgeaktion im gebundenen ACP-Sitzungstranskript landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agents in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-ähnlicher Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit rein administrativen synthetischen Feldern für die Ursprungsroute, sodass Tests Message-Channel-Kontext anhängen können, ohne so zu tun, als würden sie extern zustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test das integrierte Agent-Register des eingebetteten Plugins `acpx` für den ausgewählten ACP-Harness-Agent.

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

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen die aggregierten Live-CLI-Agents `claude`, `codex` und dann `gemini` aus.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzugrenzen.
- Er lädt `~/.profile`, stellt das passende CLI-Authentifizierungsmaterial im Container bereit und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid über `https://app.factory.ai/cli`, `@google/gemini-cli` oder `opencode-ai`), falls sie fehlt. Das ACP-Backend selbst ist das mitgelieferte eingebettete Paket `acpx/runtime` aus dem Plugin `acpx`.
- Die Droid-Docker-Variante stellt `~/.factory` für Einstellungen bereit, leitet `FACTORY_API_KEY` weiter und erfordert diesen API-Schlüssel, weil lokales Factory-OAuth/Keyring-Auth nicht portabel in den Container übertragbar ist. Sie verwendet den integrierten Registereintrag von ACPX `droid exec --output-format acp`.
- Die OpenCode-Docker-Variante ist eine strikte Lane für Einzel-Agent-Regressionen. Sie schreibt nach dem Laden von `~/.profile` ein temporäres Standardmodell `OPENCODE_CONFIG_CONTENT` aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (Standard `opencode/kimi-k2.6`), und `pnpm test:docker:live-acp-bind:opencode` erfordert ein gebundenes Assistant-Transkript, statt den generischen Skip nach dem Binden zu akzeptieren.
- Direkte CLI-Aufrufe von `acpx` sind nur ein manueller/Workaround-Pfad zum Vergleichen von Verhalten außerhalb des Gateway. Der Docker-ACP-Bind-Smoke testet das eingebettete Laufzeit-Backend `acpx` von OpenClaw.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: das Plugin-eigene Codex-Harness über die normale Gateway-
  Methode `agent` validieren:
  - das mitgelieferte Plugin `codex` laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Durchlauf an `openai/gpt-5.2` senden, bei dem das Codex-Harness erzwungen wird
  - einen zweiten Durchlauf an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad ausführen
  - optional zwei von Guardian geprüfte eskalierte Shell-Probes ausführen: einen harmlosen
    Befehl, der genehmigt werden sollte, und einen gefälschten Secret-Upload, der
    abgelehnt werden sollte, sodass der Agent nachfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `openai/gpt-5.2`
- Optionale Bild-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein defektes Codex-
  Harness nicht durch stillschweigenden Rückfall auf PI bestehen kann.
- Auth: Codex-App-Server-Auth aus dem lokalen Codex-subscription-Login. Docker-
  Smokes können außerdem `OPENAI_API_KEY` für nicht-Codex-Probes bereitstellen, wenn anwendbar,
  sowie optional kopierte `~/.codex/auth.json` und `~/.codex/config.toml`.

Lokales Rezept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-codex-harness-docker.sh`.
- Er lädt das eingehängte `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert bei Vorhandensein Auth-Dateien der Codex CLI, installiert `@openai/codex` in ein beschreibbares eingehängtes npm-Präfix, stellt den Quellbaum bereit und führt dann nur den Live-Test des Codex-Harness aus.
- Docker aktiviert standardmäßig die Bild-, MCP-/Tool- und Guardian-Probes. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen engeren Debug-
  Lauf benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, sodass alte Aliasse oder ein PI-Fallback keine Regression des Codex-Harness verbergen können.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Calling über mehrere Provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus auf Google (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke für adaptives Thinking bei Google:
  - Wenn lokale Schlüssel im Shell-Profil liegen: `source ~/.profile`
  - Gemini 3 dynamischer Standard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisches Budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-ähnlicher Agent-Endpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini CLI auf Ihrem Rechner (separate Auth + eigene Tooling-Eigenheiten).
- Gemini API vs. Gemini CLI:
  - API: OpenClaw ruft die gehostete Gemini-API von Google über HTTP auf (API-Schlüssel / Profil-Auth); das ist meist gemeint, wenn Benutzer „Gemini“ sagen.
  - CLI: OpenClaw führt ein lokales `gemini`-Binary per Shell aus; es hat eigene Auth und kann sich anders verhalten (Streaming/Tool-Unterstützung/Versionsabweichungen).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwickler-Maschine mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Calling + Bild)

Das ist der Lauf mit den „gängigen Modellen“, der weiterhin funktionieren soll:

- OpenAI (nicht Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Basislinie: Tool-Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (wünschenswert):

- xAI: `xai/grok-4` (oder neueste verfügbare Version)
- Mistral: `mistral/`… (ein aktiviertes Modell mit Tool-Fähigkeit auswählen)
- Cerebras: `cerebras/`… (wenn Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI-Varianten mit Vision-Unterstützung usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie passende Schlüssel aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bild-Fähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Zugangsdaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, in der Dokumentation „alle Modelle“ fest zu kodieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrer Maschine zurückgibt + welche Schlüssel verfügbar sind.

## Zugangsdaten (niemals committen)

Live-Tests finden Zugangsdaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „no creds“ meldet, debuggen Sie auf dieselbe Weise wie bei `openclaw models list` / Modellauswahl.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist gemeint, wenn in Live-Tests von „Profilschlüsseln“ die Rede ist)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Älteres Zustandsverzeichnis: `~/.openclaw/credentials/` (wird bei Vorhandensein in das vorbereitete Live-Home kopiert, ist aber nicht der Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json` pro Agent, das ältere `credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; vorbereitete Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfadüberschreibungen `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht in Ihrem echten Host-Workspace landen.

Wenn Sie sich auf Env-Schlüssel verlassen möchten (z. B. in Ihrer `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container mounten).

## Live: Deepgram (Audio-Transkription)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live: BytePlus Coding Plan

- Test: `extensions/byteplus/live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: ComfyUI-Workflow-Medien

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die mitgelieferten Comfy-Pfade für Bilder, Video und `music_generate`
  - Überspringt jede Fähigkeit, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an Workflow-Einreichung, Polling, Downloads oder Plugin-Registrierung von Comfy

## Live: Bildgenerierung

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Provider-Plugin für Bildgenerierung auf
  - Lädt fehlende Provider-Env-Variablen vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt jeden konfigurierten Provider durch die gemeinsame Laufzeit der Bildgenerierung:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Unterstützung für Edit deklariert
- Derzeit abgedeckte mitgelieferte Provider:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profilspeicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

Für den ausgelieferten CLI-Pfad fügen Sie nach Bestehen des Live-Tests für Provider/Laufzeit
einen `infer`-Smoke hinzu:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Das deckt Parsing von CLI-Argumenten, Auflösung von config/Standard-Agent, Aktivierung mitgelieferter
Plugins, Reparatur gemeinsam genutzter Laufzeitabhängigkeiten bei Bedarf, die gemeinsame
Laufzeit der Bildgenerierung und die Live-Provider-Anfrage ab.

## Live: Musikgenerierung

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen mitgelieferten Provider-Pfad für Musikgenerierung
  - Deckt derzeit Google und MiniMax ab
  - Lädt vor dem Probing Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Laufzeitmodi aus, wenn verfügbar:
    - `generate` mit Eingabe nur über Prompt
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung in der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profilspeicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

## Live: Videogenerierung

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen mitgelieferten Provider-Pfad für Videogenerierung
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: Nicht-FAL-Provider, eine Anfrage text-zu-video pro Provider, ein einsekündiger Lobster-Prompt und eine Obergrenze pro Provider-Vorgang aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` standardmäßig)
  - Überspringt FAL standardmäßig, weil providerseitige Queue-Latenz die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt vor dem Probing Provider-Env-Variablen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transformationsmodi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und das ausgewählte Provider-/Modellpaar in dem gemeinsamen Sweep lokal gepufferte Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und das ausgewählte Provider-/Modellpaar in dem gemeinsamen Sweep lokal gepufferte Videoeingaben akzeptiert
  - Aktuelle im gemeinsamen Sweep deklarierte, aber übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das mitgelieferte `veo3` nur Text unterstützt und das mitgelieferte `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` text-zu-video plus eine `kling`-Lane aus, die standardmäßig eine Fixture mit Remote-Bild-URL verwendet
  - Aktuelle Live-Abdeckung für `videoToVideo`:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuelle im gemeinsamen Sweep deklarierte, aber übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Referenz-URLs mit Remote-`http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini/Veo-Lane lokal gepufferte Eingaben verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil die aktuelle gemeinsame Lane keine garantierten org-spezifischen Zugriffe auf Video-Inpaint/Remix hat
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep aufzunehmen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um die Obergrenze pro Provider-Vorgang für einen aggressiven Smoke-Lauf zu senken
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profilspeicher zu erzwingen und reine Env-Überschreibungen zu ignorieren

## Harness für Medien-Live-Tests

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suites für Bild, Musik und Video über einen einzigen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Env-Variablen automatisch aus `~/.profile`
  - Engt jede Suite standardmäßig automatisch auf Provider ein, die aktuell nutzbare Auth haben
  - Verwendet `scripts/test-live.mjs` erneut, damit Verhalten von Heartbeat und Quiet-Modus konsistent bleibt
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandt

- [Testing](/de/help/testing) — Unit-, Integrations-, QA- und Docker-Suites
