---
read_when:
    - Ausführen von Live-Smokes für Modellmatrix / CLI-Backend / ACP / Medien-Provider
    - Debuggen der Auflösung von Anmeldedaten in Live-Tests
    - Hinzufügen eines neuen providerspezifischen Live-Tests
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Anmeldedaten'
title: 'Tests: Live-Suiten'
x-i18n:
    generated_at: "2026-04-25T13:48:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

Für Schnellstart, QA-Runner, Unit-/Integration-Suiten und Docker-Abläufe siehe
[Testing](/de/help/testing). Diese Seite behandelt die **Live**-Tests mit Netzwerkzugriff:
Modellmatrix, CLI-Backends, ACP und Live-Tests für Medien-Provider sowie die Handhabung von Anmeldedaten.

## Live: lokale Profile-Smoke-Befehle

Sourcen Sie `~/.profile` vor ad hoc Live-Prüfungen, damit Provider-Keys und lokale Tool-
Pfade zu Ihrer Shell passen:

```bash
source ~/.profile
```

Sicherer Medien-Smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Sicherer Readiness-Smoke für Voice Calls:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Dry Run, solange `--yes` nicht zusätzlich vorhanden ist. Verwenden Sie `--yes` nur dann,
wenn Sie absichtlich einen echten Benachrichtigungsanruf platzieren möchten. Für Twilio, Telnyx und
Plivo erfordert eine erfolgreiche Readiness-Prüfung eine öffentliche Webhook-URL; lokale
Loopback-/private Fallbacks werden absichtlich abgelehnt.

## Live: Sweep der Android-Node-Fähigkeiten

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Node aufrufen und das Verhalten des Befehlsvertrags validieren.
- Umfang:
  - Vorbereitete/manuelle Einrichtung (die Suite installiert/startet/pairt die App nicht).
  - Validierung von Gateway-`node.invoke` Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliche Vorbereitung:
  - Android-App bereits mit dem Gateway verbunden und gepairt.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungszustimmung für Fähigkeiten erteilen, die erfolgreich sein sollen.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profile-Keys)

Live-Tests sind in zwei Schichten aufgeteilt, damit Fehler isoliert werden können:

- „Direktes Modell“ zeigt uns, ob der Provider/das Modell mit dem gegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ zeigt uns, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Schicht 1: Direkte Modell-Completion (kein Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Anmeldedaten haben
  - Eine kleine Completion pro Modell ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (durch Kommas getrennte Allowlist)
  - Moderne/alle Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für ein kleineres Limit.
  - Vollständige Sweeps verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` für das Timeout des gesamten Direktmodell-Tests. Standard: 60 Minuten.
  - Direktmodell-Probes laufen standardmäßig mit 20-facher Parallelität; setzen Sie `OPENCLAW_LIVE_MODEL_CONCURRENCY`, um dies zu überschreiben.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (durch Kommas getrennte Allowlist)
- Woher die Keys kommen:
  - Standardmäßig: Profile-Speicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um nur den **Profile-Speicher** zu erzwingen
- Warum das existiert:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Abläufe)

### Schicht 2: Gateway + Dev-Agent-Smoke (was `@openclaw` tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Keys durchlaufen und validieren:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie zu `read` und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agenten auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann per `read` zurückzulesen.
  - Bild-Probe: Der Test hängt ein generiertes PNG an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Komma-Liste) setzen, um einzugrenzen
  - Moderne/alle Gateway-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für ein kleineres Limit.
- Providerauswahl (vermeiden Sie „OpenRouter alles“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (durch Kommas getrennte Allowlist)
- Tool- und Bild-Probes sind in diesem Live-Test immer aktiv:
  - `read`-Probe + `exec+read`-Probe (Tool-Stress)
  - Bild-Probe läuft, wenn das Modell Unterstützung für Bildeingabe ankündigt
  - Ablauf (allgemein):
    - Test generiert ein kleines PNG mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - eingebetteter Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Validierung: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrer Maschine testen können (und die genauen `provider/model`-IDs), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway+Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration anzufassen.
- Backend-spezifische Smoke-Standardwerte liegen in der Definition `cli-backend.ts` der besitzenden Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Verhalten von Befehl/Args/Bildern kommt aus den Metadaten des besitzenden CLI-Backend-Plugins.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert). Docker-Rezepte haben dies standardmäßig deaktiviert, sofern nicht explizit angefordert.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt per Prompt-Injection zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Ablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um die Kontinuitätsprobe derselben Sitzung Claude Sonnet -> Opus zu aktivieren, wenn das ausgewählte Modell ein Umschaltziel unterstützt. Docker-Rezepte haben dies standardmäßig aus Gründen der Gesamtzuverlässigkeit deaktiviert.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um die MCP-/Tool-Loopback-Probe zu aktivieren. Docker-Rezepte haben dies standardmäßig deaktiviert, sofern nicht explizit angefordert.

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
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

- Der Docker-Runner liegt unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke im Docker-Image des Repos als Nicht-Root-Benutzer `node` aus.
- Er löst Metadaten des CLI-Smokes aus der besitzenden Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein gecachtes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude-Code-Subscription-OAuth entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` von `claude setup-token`. Es prüft zuerst direktes `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-key-Env-Variablen beizubehalten. Dieser Subscription-Lane deaktiviert standardmäßig Claude-MCP-/Tool- und Bild-Probes, weil Claude derzeit die Nutzung durch Drittanbieter-Apps über zusätzliche Nutzungsabrechnung statt über normale Subscription-Plan-Limits abrechnet.
- Der Live-CLI-Backend-Smoke testet jetzt denselben Ende-zu-Ende-Ablauf für Claude, Codex und Gemini: Text-Turn, Turn zur Bildklassifikation, dann MCP-Tool-Call `cron`, verifiziert über die Gateway-CLI.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass sich die fortgesetzte Sitzung weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten Conversation-Bind-Ablauf von ACP mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Unterhaltung über einen Nachrichtenkanal direkt vor Ort binden
  - ein normales Follow-up in derselben Unterhaltung senden
  - verifizieren, dass das Follow-up im Transkript der gebundenen ACP-Sitzung landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Unterhaltungskontext im Stil einer Slack-DM
  - ACP-Backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Hinweise:
  - Dieser Lane verwendet die Oberfläche `chat.send` des Gateways mit admin-only-Feldern für synthetische Ursprungsrouten, damit Tests Kontext von Nachrichtenkanälen anhängen können, ohne vorzugeben, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die eingebaute Agent-Registry des eingebetteten Plugins `acpx` für den ausgewählten ACP-Harness-Agenten.

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
pnpm test:docker:live-acp-bind:opencode
```

Hinweise zu Docker:

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen die aggregierten Live-CLI-Agenten aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzugrenzen.
- Er sourct `~/.profile`, stellt das passende CLI-Auth-Material im Container bereit und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` oder `opencode-ai`), falls sie fehlt. Das ACP-Backend selbst ist das gebündelte eingebettete Paket `acpx/runtime` aus dem Plugin `acpx`.
- Die Docker-Variante für OpenCode ist ein strikter Single-Agent-Regressionspfad. Sie schreibt ein temporäres Standardmodell `OPENCODE_CONFIG_CONTENT` aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (Standard `opencode/kimi-k2.6`) nach dem Sourcen von `~/.profile`, und `pnpm test:docker:live-acp-bind:opencode` erfordert ein gebundenes Assistant-Transkript, statt den generischen Skip nach dem Binden zu akzeptieren.
- Direkte CLI-Aufrufe von `acpx` sind nur ein manueller/Workaround-Pfad, um Verhalten außerhalb des Gateway zu vergleichen. Der Docker-ACP-Bind-Smoke testet das eingebettete Runtime-Backend `acpx` von OpenClaw.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: das Plugin-eigene Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte Plugin `codex` laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agenten-Turn an `openai/gpt-5.2` senden, wobei das Codex-Harness erzwungen wird
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehls-
    Pfad ausführen
  - optional zwei von Guardian überprüfte eskalierte Shell-Probes ausführen: einen harmlosen
    Befehl, der genehmigt werden sollte, und einen Fake-Secret-Upload, der
    abgelehnt werden sollte, sodass der Agent nachfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `openai/gpt-5.2`
- Optionale Bild-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein defektes Codex-
  Harness nicht unbemerkt durch stillen Fallback auf PI bestehen kann.
- Auth: Codex-App-Server-Authentifizierung aus dem lokalen Codex-Subscription-Login. Docker-
  Smokes können auch `OPENAI_API_KEY` für Nicht-Codex-Probes bereitstellen, wenn zutreffend,
  plus optional kopierte `~/.codex/auth.json` und `~/.codex/config.toml`.

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

Hinweise zu Docker:

- Der Docker-Runner liegt unter `scripts/test-live-codex-harness-docker.sh`.
- Er sourct das eingehängte `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Auth-Dateien, falls vorhanden, installiert `@openai/codex` in ein beschreibbares eingehängtes npm-
  Präfix, stellt den Source-Tree bereit und führt dann nur den Live-Test für das Codex-Harness aus.
- Docker aktiviert standardmäßig die Bild-, MCP-/Tool- und Guardian-Probes. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen engeren Debug-
  Lauf benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, damit Legacy-Aliase oder PI-Fallback eine Codex-Harness-
  Regression nicht verbergen können.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Aufrufe über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google Adaptive-Thinking-Smoke:
  - Wenn lokale Keys im Shell-Profil liegen: `source ~/.profile`
  - Gemini 3 Dynamic Default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 Dynamic Budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini-API (API key).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agentenendpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrer Maschine (separate Authentifizierung + Besonderheiten bei Tooling).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft die gehostete Gemini-API von Google über HTTP auf (API key / Profil-Auth); das ist in der Regel gemeint, wenn Benutzer „Gemini“ sagen.
  - CLI: OpenClaw ruft lokal ein `gemini`-Binary auf; es hat seine eigene Authentifizierung und kann sich anders verhalten (Streaming/Tool-Unterstützung/Versionsabweichungen).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwickler-Maschine mit Keys abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Aufrufe + Bild)

Das ist der Lauf für „gängige Modelle“, der weiterhin funktionieren soll:

- OpenAI (nicht Codex): `openai/gpt-5.2`
- OpenAI-Codex-OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (vermeiden Sie ältere Gemini-2.x-Modelle)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool-Aufrufe (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell, das bei Ihnen aktiviert ist)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Aufrufe hängen vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude-/Gemini-/OpenAI-Varianten mit Vision-Fähigkeit usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie entsprechende Keys aktiviert haben, unterstützen wir Tests auch über:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bild-Unterstützung zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Anmeldedaten/Konfiguration haben):

- Eingebaut: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, „alle Modelle“ in der Dokumentation fest zu codieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrer Maschine zurückgibt + welche Keys verfügbar sind.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Keys finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie auf dieselbe Weise wie bei `openclaw models list` / Modellauswahl.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist es, was „Profile keys“ in den Live-Tests bedeutet)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-Statusverzeichnis: `~/.openclaw/credentials/` (wird in das vorbereitete Live-Home kopiert, wenn vorhanden, ist aber nicht der Hauptspeicher für Profile keys)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; vorbereitete Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht in Ihrem echten Host-Workspace laufen.

Wenn Sie sich auf Env-Keys verlassen möchten (z. B. in Ihrem `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container einhängen).

## Deepgram Live (Audiotranskription)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus Coding Plan Live

- Test: `extensions/byteplus/live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionales Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien Live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten Pfade für comfy-Bild, -Video und `music_generate`
  - Überspringt jede Fähigkeit, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Submission, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung Live

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Plugin für Image Generation Provider auf
  - Lädt fehlende Provider-Env-Variablen vor dem Prüfen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt jeden konfigurierten Provider über die gemeinsame Runtime für Bildgenerierung aus:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Unterstützung für Bearbeitung deklariert
- Aktuell abgedeckte gebündelte Provider:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Speicher zu erzwingen und reine Env-Overrides zu ignorieren

Für den ausgelieferten CLI-Pfad fügen Sie einen `infer`-Smoke hinzu, nachdem der Live-
Test für Provider/Runtime erfolgreich war:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dies deckt das Parsen von CLI-Argumenten, die Auflösung von Konfiguration/Standard-Agent, die Aktivierung gebündelter
Plugins, die bedarfsgesteuerte Reparatur gebündelter Runtime-Abhängigkeiten, die gemeinsame
Runtime für Bildgenerierung und die Live-Provider-Anfrage ab.

## Musikgenerierung Live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen gebündelten Provider-Pfad für Musikgenerierung
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Env-Variablen vor dem Prüfen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit Eingabe nur per Prompt
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung des gemeinsamen Pfads:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Speicher zu erzwingen und reine Env-Overrides zu ignorieren

## Videogenerierung Live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen gebündelten Provider-Pfad für Videogenerierung
  - Standardmäßig wird der release-sichere Smoke-Pfad verwendet: Nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Hummer-Prompt und ein Provider-spezifisches Operationslimit aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil providerseitige Queue-Latenz die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt Provider-Env-Variablen vor dem Prüfen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen, damit veraltete Test-Keys in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um bei Verfügbarkeit auch deklarierte Transformationsmodi auszuführen:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und das ausgewählte Provider-/Modell im gemeinsamen Sweep lokalen Bildeingang auf Buffer-Basis akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und das ausgewählte Provider-/Modell im gemeinsamen Sweep lokalen Videoeingang auf Buffer-Basis akzeptiert
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine entfernte Bild-URL erfordert
  - Providerspezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video plus einen `kling`-Pfad aus, der standardmäßig eine Fixture mit entfernter Bild-URL verwendet
  - Aktuelle Live-Abdeckung für `videoToVideo`:
    - `runway` nur dann, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit entfernte Referenz-URLs `http(s)` / MP4 erfordern
    - `google`, weil der aktuelle gemeinsame Gemini-/Veo-Pfad lokalen Input auf Buffer-Basis verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil dem aktuellen gemeinsamen Pfad Garantien für organisationsspezifischen Zugriff auf Video-Inpaint/Remix fehlen
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep aufzunehmen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit pro Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Speicher zu erzwingen und reine Env-Overrides zu ignorieren

## Medien-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suiten für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Env-Variablen automatisch aus `~/.profile`
  - Grenzt standardmäßig jede Suite automatisch auf Provider ein, die derzeit nutzbare Auth haben
  - Verwendet `scripts/test-live.mjs` wieder, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandt

- [Testing](/de/help/testing) — Unit-, Integration-, QA- und Docker-Suiten
