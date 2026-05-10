---
read_when:
    - Live-Modellmatrix-, CLI-Backend-, ACP- und Media-Provider-Smoke-Tests ausführen
    - Debugging der Zugangsdatenauflösung für Live-Tests
    - Hinzufügen eines neuen Provider-spezifischen Live-Tests
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Zugangsdaten'
title: 'Tests: Live-Suites'
x-i18n:
    generated_at: "2026-05-10T19:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

Für den Schnellstart, QA-Runner, Unit-/Integrationssuiten und Docker-Abläufe siehe
[Testing](/de/help/testing). Diese Seite behandelt die **Live**-Testsuiten (mit Netzwerkzugriff):
Modellmatrix, CLI-Backends, ACP und Live-Tests für Medien-Provider sowie
den Umgang mit Anmeldeinformationen.

## Live: Smoke-Befehle für lokale Profile

Laden Sie `~/.profile` vor Ad-hoc-Live-Prüfungen, damit Provider-Schlüssel und lokale Tool-
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

Sicherer Smoke für die Bereitschaft von Sprachanrufen:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Trockenlauf, sofern nicht auch `--yes` vorhanden ist. Verwenden Sie `--yes` nur,
wenn Sie absichtlich einen echten Benachrichtigungsanruf auslösen möchten. Für Twilio, Telnyx und
Plivo erfordert eine erfolgreiche Bereitschaftsprüfung eine öffentliche Webhook-URL; rein lokale
loopback-/private Fallbacks werden absichtlich abgelehnt.

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Node aufrufen und das Verhalten des Befehlsvertrags prüfen.
- Umfang:
  - Vorausgesetzte/manuelle Einrichtung (die Suite installiert/startet/paart die App nicht).
  - Befehlsweise Gateway-`node.invoke`-Validierung für den ausgewählten Android-Node.
- Erforderliche Voreinrichtung:
  - Android-App bereits verbunden und mit dem Gateway gepaart.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungseinwilligung für Capabilities erteilt, die Sie erfolgreich prüfen möchten.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ zeigt, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ zeigt, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkter Modellabschluss (kein Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle auflisten
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Anmeldeinformationen haben
  - Pro Modell einen kleinen Abschluss ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (kommagetrennte Allowlist)
  - Modern/all-Sweeps verwenden standardmäßig eine kuratierte High-Signal-Obergrenze; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen Modern-Sweep oder eine positive Zahl für eine kleinere Obergrenze.
  - Vollständige Sweeps verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` für das gesamte direkte Modelltest-Timeout. Standard: 60 Minuten.
  - Direkte Modellprüfungen laufen standardmäßig mit 20-facher Parallelität; setzen Sie `OPENCLAW_LIVE_MODEL_CONCURRENCY`, um dies zu überschreiben.
- Provider-Auswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (kommagetrennte Allowlist)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um ausschließlich den **Profilspeicher** zu erzwingen
- Zweck:
  - Trennt „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI Responses/Codex Responses Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was „@openclaw“ tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine `agent:dev:*`-Sitzung erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und prüfen:
    - „aussagekräftige“ Antwort (keine Tools)
    - ein echter Tool-Aufruf funktioniert (Leseprüfung)
    - optionale zusätzliche Tool-Prüfungen (Exec+Leseprüfung)
    - OpenAI-Regressionspfade (nur Tool-Call → Folgeanfrage) funktionieren weiter
- Prüfungsdetails (damit Sie Fehler schnell erklären können):
  - `read`-Prüfung: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agent auf, sie mit `read` zu lesen und die Nonce zurückzugeben.
  - `exec+read`-Prüfung: Der Test fordert den Agent auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann per `read` zurückzulesen.
  - Bildprüfung: Der Test hängt ein generiertes PNG an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine kommagetrennte Liste), um einzugrenzen
  - Modern/all-Gateway-Sweeps verwenden standardmäßig eine kuratierte High-Signal-Obergrenze; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen Modern-Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- Provider-Auswahl („OpenRouter für alles“ vermeiden):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (kommagetrennte Allowlist)
- Tool- und Bildprüfungen sind in diesem Live-Test immer aktiv:
  - `read`-Prüfung + `exec+read`-Prüfung (Tool-Stresstest)
  - Bildprüfung läuft, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Ablauf (auf hoher Ebene):
    - Test generiert ein kleines PNG mit „CAT“ + Zufallscode (`src/gateway/live-image-probe.ts`)
    - Sendet es über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Anhänge in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleinere Fehler erlaubt)

<Tip>
Um zu sehen, was Sie auf Ihrem Rechner testen können (und die exakten `provider/model`-IDs), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu berühren.
- Backend-spezifische Smoke-Standards befinden sich in der `cli-backend.ts`-Definition des zuständigen Plugins.
- Aktivieren:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standards:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Befehls-/Argument-/Bildverhalten stammt aus den Metadaten des zuständigen CLI-Backend-Plugins.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in den Prompt injiziert). Docker-Rezepte deaktivieren dies standardmäßig, sofern nicht ausdrücklich angefordert.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um eine zweite Runde zu senden und den Fortsetzungsfluss zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um sich für die Claude-Sonnet-zu-Opus-Kontinuitätsprüfung in derselben Sitzung zu entscheiden, wenn das ausgewählte Modell ein Wechselziel unterstützt. Docker-Rezepte deaktivieren dies standardmäßig zugunsten aggregierter Zuverlässigkeit.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um sich für die MCP-/Tool-loopback-Prüfung zu entscheiden. Docker-Rezepte deaktivieren dies standardmäßig, sofern nicht ausdrücklich angefordert.

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Günstiger Gemini-MCP-Konfigurations-Smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dabei wird Gemini nicht aufgefordert, eine Antwort zu generieren. Es schreibt dieselben System-
Einstellungen, die OpenClaw Gemini gibt, und führt dann `gemini --debug mcp list` aus, um nachzuweisen, dass ein
gespeicherter `transport: "streamable-http"`-Server in Geminis HTTP-MCP-
Form normalisiert wird und eine Verbindung zu einem lokalen streamable-HTTP-MCP-Server herstellen kann.

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
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als Nicht-Root-Benutzer `node` aus.
- Er löst CLI-Smoke-Metadaten aus dem zuständigen Plugin auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude-Code-Subscription-OAuth entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es weist zuerst direktes `claude -p` in Docker nach und führt dann zwei Gateway-CLI-Backend-Runden ohne Beibehaltung von Anthropic-API-Schlüssel-Env-Vars aus. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Bildprüfungen, weil Claude die Nutzung durch Drittanbieter-Apps derzeit über Zusatznutzungsabrechnung statt über normale Subscription-Planlimits routet.
- Der Live-CLI-Backend-Smoke übt jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini aus: Textrunde, Bildklassifizierungsrunde, dann MCP-`cron`-Tool-Aufruf, der über die Gateway-CLI verifiziert wird.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass sich die fortgesetzte Sitzung weiterhin an eine frühere Notiz erinnert.

## Live: APNs-HTTP/2-Proxy-Erreichbarkeit

- Test: `src/infra/push-apns-http2.live.test.ts`
- Ziel: über einen lokalen HTTP-CONNECT-Proxy zu Apples Sandbox-APNs-Endpunkt tunneln, die APNs-HTTP/2-Validierungsanfrage senden und prüfen, dass Apples echte `403 InvalidProviderToken`-Antwort über den Proxy-Pfad zurückkommt.
- Aktivieren:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionales Timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Gesprächsbindungsablauf mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - ein synthetisches Message-Channel-Gespräch vor Ort binden
  - eine normale Folgeantwort im selben Gespräch senden
  - prüfen, dass die Folgeantwort im Transcript der gebundenen ACP-Sitzung ankommt
- Aktivieren:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Channel: Slack-DM-artiger Gesprächskontext
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
  - Dieser Lane nutzt die Gateway-`chat.send`-Oberfläche mit nur für Admins gedachten synthetischen Ursprung-Routen-Feldern, damit Tests Message-Channel-Kontext anhängen können, ohne so zu tun, als würden sie extern zustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agentenregistrierung des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agenten.
  - Die Cron-MCP-Erstellung für gebundene Sitzungen erfolgt standardmäßig nach bestem Ermessen, weil externe ACP-Harnesses MCP-Aufrufe nach bestandener Bind-/Image-Prüfung abbrechen können; setzen Sie `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, um diese Cron-Prüfung nach dem Binden strikt zu machen.

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
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen die aggregierten Live-CLI-Agenten aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzugrenzen.
- Er lädt `~/.profile`, legt das passende CLI-Authentifizierungsmaterial im Container bereit und installiert dann bei Bedarf die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid über `https://app.factory.ai/cli`, `@google/gemini-cli` oder `opencode-ai`). Das ACP-Backend selbst ist das eingebettete Paket `acpx/runtime` aus dem offiziellen `acpx`-Plugin.
- Die Droid-Docker-Variante stellt `~/.factory` für Einstellungen bereit, leitet `FACTORY_API_KEY` weiter und benötigt diesen API-Schlüssel, weil lokale Factory-OAuth-/Keyring-Authentifizierung nicht portabel in den Container ist. Sie verwendet den integrierten Registrierungseintrag `droid exec --output-format acp` von ACPX.
- Die OpenCode-Docker-Variante ist eine strikte Regressions-Lane für einen einzelnen Agenten. Sie schreibt nach dem Laden von `~/.profile` ein temporäres `OPENCODE_CONFIG_CONTENT`-Standardmodell aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (Standard `opencode/kimi-k2.6`), und `pnpm test:docker:live-acp-bind:opencode` verlangt ein gebundenes Assistant-Transcript, statt den generischen Skip nach dem Binden zu akzeptieren.
- Direkte `acpx`-CLI-Aufrufe sind nur ein manueller/Workaround-Pfad zum Vergleichen des Verhaltens außerhalb des Gateway. Der Docker-ACP-Bind-Smoke testet das eingebettete `acpx`-Runtime-Backend von OpenClaw.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: das Plugin-eigene Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte `codex`-Plugin laden
  - `openai/gpt-5.5` auswählen, wodurch OpenAI-Agent-Turns standardmäßig über Codex geleitet werden
  - einen ersten Gateway-Agent-Turn an `openai/gpt-5.5` mit ausgewähltem Codex-Harness senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und prüfen, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad ausführen
  - optional zwei von Guardian geprüfte eskalierte Shell-Probes ausführen: einen harmlosen
    Befehl, der genehmigt werden sollte, und einen Fake-Secret-Upload, der
    abgelehnt werden sollte, sodass der Agent zurückfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `openai/gpt-5.5`
- Optionale Image-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoke erzwingt Provider/Modell `agentRuntime.id: "codex"`, damit ein defektes Codex-
  Harness nicht durch stilles Zurückfallen auf PI bestehen kann.
- Authentifizierung: Codex-App-Server-Authentifizierung aus der lokalen Codex-Abonnementanmeldung. Docker-
  Smokes können bei Bedarf außerdem `OPENAI_API_KEY` für Nicht-Codex-Probes bereitstellen,
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
- Er lädt das gemountete `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Authentifizierungsdateien, wenn vorhanden, installiert `@openai/codex` in ein beschreibbares gemountetes npm-
  Präfix, stellt den Quellbaum bereit und führt dann nur den Codex-Harness-Live-Test aus.
- Docker aktiviert die Image-, MCP-/Tool- und Guardian-Probes standardmäßig. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen engeren Debug-
  Lauf benötigen.
- Docker verwendet dieselbe explizite Codex-Runtime-Konfiguration, sodass Legacy-Aliase oder PI-
  Fallback eine Codex-Harness-Regression nicht verbergen können.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (kein Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Aufrufe über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Smoke für adaptives Denken:
  - Wenn lokale Schlüssel im Shell-Profil liegen: `source ~/.profile`
  - Dynamischer Gemini-3-Standardwert: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamisches Gemini-2.5-Budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpunkt).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrem Rechner (separate Authentifizierung + Eigenheiten beim Tooling).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API per HTTP auf (API-Schlüssel / Profil-Authentifizierung); das meinen die meisten Benutzer mit "Gemini".
  - CLI: OpenClaw startet ein lokales `gemini`-Binary per Shell; es hat seine eigene Authentifizierung und kann sich anders verhalten (Streaming-/Tool-Unterstützung/Versionsabweichung).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste "CI-Modellliste" (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einem Entwicklungsrechner mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Aufrufe + Image)

Dies ist der Lauf für "gängige Modelle", von dem wir erwarten, dass er funktionsfähig bleibt:

- OpenAI (nicht Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` und `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Image ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool-Aufrufe (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4.3` (oder neuestes verfügbares)
- Mistral: `mistral/`… (wählen Sie ein für "Tools" geeignetes Modell, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (wenn Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Aufrufe hängen vom API-Modus ab)

### Vision: Image senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein Image-fähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude-/Gemini-/OpenAI-Varianten mit Vision-Fähigkeit usw.), um die Image-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie Schlüssel aktiviert haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Tool- und Image-fähige Kandidaten zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Anmeldedaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API), plus beliebige OpenAI-/Anthropic-kompatible Proxys (LM Studio, vLLM, LiteLLM usw.)

<Tip>
Codieren Sie "all models" nicht fest in der Dokumentation. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrem Rechner zurückgibt, plus die jeweils verfügbaren Schlüssel.
</Tip>

## Anmeldedaten (niemals committen)

Live-Tests finden Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „no creds“ meldet, debuggen Sie es genauso, wie Sie `openclaw models list` / die Modellauswahl debuggen würden.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist in den Live-Tests mit „profile keys“ gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-State-Verzeichnis: `~/.openclaw/credentials/` (wird, falls vorhanden, in das gestagte Live-Home kopiert, ist aber nicht der Hauptspeicher für Profil-Schlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; gestagte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht auf Ihrem echten Host-Workspace laufen.

Wenn Sie sich auf Env-Schlüssel verlassen möchten (z. B. aus Ihrer `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus, oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container einhängen).

## Deepgram live (Audiotranskription)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktivieren: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-Coding-Plan live

- Test: `extensions/byteplus/live.test.ts`
- Aktivieren: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionaler Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten comfy-Pfade für Bild, Video und `music_generate`
  - Überspringt jede Capability, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Listet jedes registrierte Provider-Plugin für Bildgenerierung auf
  - Lädt fehlende Provider-Env-Vars vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` keine echten Shell-Zugangsdaten verdecken
  - Überspringt Provider ohne nutzbare Auth/Profile/Modell
  - Führt jeden konfigurierten Provider durch die gemeinsame Bildgenerierungs-Runtime:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Bearbeitungsunterstützung deklariert
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und reine Env-Overrides zu ignorieren

Für den ausgelieferten CLI-Pfad fügen Sie nach bestandenem Provider-/Runtime-Live-Test einen `infer`-Smoke-Test hinzu:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dies deckt CLI-Argument-Parsing, Auflösung von Konfiguration/Standard-Agent, Aktivierung gebündelter Plugins, die gemeinsame Bildgenerierungs-Runtime und die Live-Provider-Anfrage ab. Es wird erwartet, dass Plugin-Abhängigkeiten vor dem Laden der Runtime vorhanden sind.

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen Pfad für gebündelte Provider zur Musikgenerierung
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Env-Vars vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` keine echten Shell-Zugangsdaten verdecken
  - Überspringt Provider ohne nutzbare Auth/Profile/Modell
  - Führt, sofern verfügbar, beide deklarierten Runtime-Modi aus:
    - `generate` mit reiner Prompt-Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und reine Env-Overrides zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen Pfad für gebündelte Provider zur Videogenerierung
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: Nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Lobster-Prompt und ein operationsbezogenes Limit pro Provider aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil die Queue-Latenz auf Provider-Seite die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um FAL explizit auszuführen
  - Lädt Provider-Env-Vars vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, damit veraltete Testschlüssel in `auth-profiles.json` keine echten Shell-Zugangsdaten verdecken
  - Überspringt Provider ohne nutzbare Auth/Profile/Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um auch deklarierte Transformationsmodi auszuführen, sofern verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale, buffer-gestützte Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep lokale, buffer-gestützte Videoeingaben akzeptiert
  - Aktuelle deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie eine `kling`-Lane aus, die standardmäßig eine Remote-Bild-URL-Fixture verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - `runway` nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuelle deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Remote-`http(s)`-/MP4-Referenz-URLs erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale, buffer-gestützte Eingaben verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Lane organisationsspezifische Zugriffsgarantien für Video-Inpainting/-Remixing fehlen
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep einzubeziehen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit pro Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und reine Env-Overrides zu ignorieren

## Medien-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suiten für Bild, Musik und Video über einen repo-nativen Einstiegspunkt aus
  - Lädt fehlende Provider-Env-Vars automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die derzeit nutzbare Auth haben
  - Verwendet `scripts/test-live.mjs` wieder, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandt

- [Testing](/de/help/testing) - Unit-, Integrations-, QA- und Docker-Suiten
