---
read_when:
    - Live-Smoke-Tests für Modellmatrix, CLI-Backend, ACP und Medien-Provider ausführen
    - Fehlerbehebung bei der Anmeldedatenauflösung für Live-Tests
    - Hinzufügen eines neuen providerspezifischen Live-Tests
sidebarTitle: Live tests
summary: 'Live-Tests (mit Netzwerkzugriff): Modellmatrix, CLI-Backends, ACP, Medien-Provider, Anmeldedaten'
title: 'Tests: Live-Suites'
x-i18n:
    generated_at: "2026-07-12T01:45:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Für Schnellstart, QA-Runner, Unit-/Integrationstest-Suites und Docker-Abläufe siehe
[Tests](/de/help/testing). Diese Seite behandelt **Live-Tests** (mit Netzwerkzugriff):
Modellmatrix, CLI-Backends, ACP, Medien-Provider und den Umgang mit Anmeldedaten.

## Live: Lokale Smoke-Test-Befehle

Exportieren Sie vor spontanen Live-Prüfungen den erforderlichen Provider-Schlüssel
in die Prozessumgebung.

Sicherer Medien-Smoke-Test:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Sicherer Smoke-Test der Bereitschaft für Sprachanrufe:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` ist ein Probelauf, sofern nicht zusätzlich `--yes` angegeben ist;
verwenden Sie `--yes` nur, wenn Sie tatsächlich einen Anruf tätigen möchten. Für
Twilio, Telnyx und Plivo erfordert eine erfolgreiche Bereitschaftsprüfung eine
öffentliche Webhook-URL – lokale/private local-loopback-URLs werden abgelehnt,
da diese Provider sie nicht erreichen können.

## Live: Umfassende Prüfung der Fähigkeiten eines Android-Nodes

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **Jeden aktuell angekündigten Befehl** eines verbundenen Android-Nodes aufrufen und das Verhalten des Befehlsvertrags prüfen.
- Umfang:
  - Vorbereitete/manuelle Einrichtung (die Suite installiert, startet und koppelt die App nicht).
  - Befehlsweise Validierung von `node.invoke` im Gateway für den ausgewählten Android-Node.
- Erforderliche Vorbereitungen:
  - Die Android-App ist bereits mit dem Gateway verbunden und gekoppelt.
  - Die App bleibt im Vordergrund.
  - Berechtigungen und Einwilligungen für Aufzeichnungen wurden für die Fähigkeiten erteilt, deren erfolgreiche Prüfung Sie erwarten.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android-App](/de/platforms/android)

## Live: Modell-Smoke-Test (Profilschlüssel)

Live-Modelltests sind in zwei Ebenen unterteilt, damit Fehler isoliert werden:

- „Direktes Modell“ zeigt Ihnen, ob der Provider bzw. das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke-Test“ zeigt Ihnen, ob die vollständige Gateway- und Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Werkzeuge, Sandbox-Richtlinie usw.).

Die nachfolgend zusammengestellten Modelllisten befinden sich in
`src/agents/live-model-filter.ts` und ändern sich im Laufe der Zeit; betrachten
Sie die dortigen Arrays als maßgebliche Quelle, nicht diese Seite.

MiniMax M3 verwendet `minimax/MiniMax-M3` als standardmäßige Provider-/Modellreferenz.

### Ebene 1: Direkte Modellvervollständigung (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle auflisten
  - Mit `getApiKeyForModel` die Modelle auswählen, für die Sie Anmeldedaten besitzen
  - Pro Modell eine kleine Vervollständigung ausführen (sowie bei Bedarf gezielte Regressionstests)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - Setzen Sie `OPENCLAW_LIVE_MODELS=modern`, `small` oder `all` (Alias für `modern`), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, sodass sich `pnpm test:live` allein weiterhin auf den Gateway-Smoke-Test konzentriert.
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern` führt die zusammengestellte Prioritätsliste mit hoher Aussagekraft aus (siehe [Live: Modellmatrix](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` führt die zusammengestellte Prioritätsliste kleiner Modelle aus
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für `modern`
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (durch Kommas getrennte Positivliste)
  - Lokale Ollama-Ausführungen mit kleinen Modellen verwenden standardmäßig `http://127.0.0.1:11434`; setzen Sie `OPENCLAW_LIVE_OLLAMA_BASE_URL` nur für LAN-, benutzerdefinierte oder Ollama-Cloud-Endpunkte.
  - Umfassende Prüfungen mit `modern`/`all` und `small` verwenden standardmäßig die Länge ihrer zusammengestellten Liste als Obergrenze; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für eine vollständige Prüfung des ausgewählten Profils oder eine positive Zahl für eine niedrigere Obergrenze.
  - Vollständige Prüfungen verwenden `OPENCLAW_LIVE_TEST_TIMEOUT_MS` als Zeitlimit für den gesamten direkten Modelltest. Standardwert: 60 Minuten.
  - Direkte Modellprüfungen werden standardmäßig mit einer Parallelität von 20 ausgeführt; setzen Sie `OPENCLAW_LIVE_MODEL_CONCURRENCY`, um dies zu überschreiben.
- Provider-Auswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (durch Kommas getrennte Positivliste)
- Herkunft der Schlüssel:
  - Standardmäßig: Profilspeicher und Umgebungs-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um ausschließlich den **Profilspeicher** zu verwenden
- Zweck:
  - Unterscheidet „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionstests (Beispiel: Wiedergabe von Schlussfolgerungen und Werkzeugaufruf-Abläufe für OpenAI Responses/Codex Responses)

### Ebene 2: Gateway- und Entwicklungs-Agent-Smoke-Test (was „@openclaw“ tatsächlich tut)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein prozessinternes Gateway starten
  - Eine `agent:dev:*`-Sitzung erstellen/anpassen (Modellüberschreibung pro Ausführung)
  - Modelle mit Schlüsseln durchlaufen und Folgendes prüfen:
    - „aussagekräftige“ Antwort (ohne Werkzeuge)
    - ein echter Werkzeugaufruf funktioniert (Leseprüfung)
    - optionale zusätzliche Werkzeugprüfungen (Ausführungs- und Leseprüfung)
    - OpenAI-Regressionspfade (nur Werkzeugaufruf -> Folgeanfrage) funktionieren weiterhin
- Details zu den Prüfungen (damit Sie Fehler schnell erklären können):
  - `read`-Prüfung: Der Test schreibt eine Datei mit einem Nonce-Wert in den Arbeitsbereich und fordert den Agent auf, sie mit `read` zu lesen und den Nonce-Wert zurückzugeben.
  - `exec+read`-Prüfung: Der Test fordert den Agent auf, mit `exec` einen Nonce-Wert in eine temporäre Datei zu schreiben und ihn anschließend mit `read` zurückzulesen.
  - Bildprüfung: Der Test hängt eine generierte PNG-Datei an (Katze und zufälliger Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `test/helpers/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standardmäßig: die zusammengestellte Prioritätsliste mit hoher Aussagekraft (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` führt die zusammengestellte Liste kleiner Modelle durch die vollständige Gateway- und Agent-Pipeline aus
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für `modern`
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine durch Kommas getrennte Liste), um die Auswahl einzugrenzen
  - Gateway-Prüfungen mit `modern`/`all` und `small` verwenden standardmäßig die Länge ihrer zusammengestellten Liste als Obergrenze; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für eine vollständige ausgewählte Prüfung oder eine positive Zahl für eine niedrigere Obergrenze.
- Provider-Auswahl („alles über OpenRouter“ vermeiden):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (durch Kommas getrennte Positivliste)
- Werkzeug- und Bildprüfungen sind in diesem Live-Test immer aktiviert:
  - `read`-Prüfung und `exec+read`-Prüfung (Werkzeug-Belastungstest)
  - Die Bildprüfung wird ausgeführt, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Ablauf (Überblick):
    - Der Test generiert eine kleine PNG-Datei mit „CAT“ und einem zufälligen Code (`test/helpers/live-image-probe.ts`)
    - Sendet sie über `agent` als `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Das Gateway verarbeitet Anhänge zu `images[]` (`src/gateway/server-methods/agent.ts` und `src/gateway/chat-attachments.ts`)
    - Der eingebettete Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Prüfung: Die Antwort enthält `cat` und den Code (OCR-Toleranz: geringfügige Fehler sind zulässig)

<Tip>
Um zu sehen, was Sie auf Ihrem Computer testen können (und die genauen `provider/model`-IDs), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-Backend-Smoke-Test (Claude, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: Die Gateway- und Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu verändern.
- Backendspezifische Smoke-Test-Standardwerte befinden sich in der `cli-backend.ts`-Definition des zuständigen Plugins.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standardmäßiger Provider bzw. standardmäßiges Modell: `claude-cli/claude-sonnet-4-6`
  - Verhalten von Befehl, Argumenten und Bildern stammt aus den Metadaten des zuständigen CLI-Backend-Plugins.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um einen echten Bildanhang zu senden (Pfade werden in die Eingabeaufforderung eingefügt). In Docker-Rezepten standardmäßig deaktiviert.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Argumente statt durch Einfügen in die Eingabeaufforderung zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bildargumente bei gesetztem `IMAGE_ARG` übergeben werden.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um eine zweite Anfrage zu senden und den Fortsetzungsablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, um die Kontinuitätsprüfung innerhalb derselben Sitzung beim Wechsel von Claude Sonnet zu Opus zu aktivieren, wenn das ausgewählte Modell ein Wechselziel unterstützt. Standardmäßig deaktiviert, auch in Docker-Rezepten.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, um die MCP-/Werkzeug-local-loopback-Prüfung zu aktivieren. In Docker-Rezepten standardmäßig deaktiviert.

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

Hierbei wird Gemini nicht aufgefordert, eine Antwort zu generieren. Der Test
schreibt dieselben Systemeinstellungen, die OpenClaw an Gemini übergibt, und
führt anschließend `gemini --debug mcp list` aus. Damit wird nachgewiesen, dass
ein gespeicherter Server mit `transport: "streamable-http"` in die HTTP-MCP-Form
von Gemini normalisiert wird und eine Verbindung zu einem lokalen
Streamable-HTTP-MCP-Server herstellen kann.

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
- Er ermittelt die CLI-Smoke-Test-Metadaten aus dem zuständigen Plugin und installiert anschließend das passende Linux-CLI-Paket (`@anthropic-ai/claude-code` oder `@google/gemini-cli`) in einem zwischengespeicherten, beschreibbaren Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standardwert: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` ist kein gebündeltes CLI-Backend mehr; verwenden Sie stattdessen `openai/*` mit der Codex-App-Server-Laufzeit (siehe [Live: Smoke-Test des Codex-App-Server-Testsystems](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable OAuth-Anmeldedaten für ein Claude-Code-Abonnement, entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder über `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Zunächst wird `claude -p` direkt in Docker geprüft; anschließend werden zwei Gateway-CLI-Backend-Anfragen ausgeführt, ohne Umgebungsvariablen für Anthropic-API-Schlüssel beizubehalten. Dieser Abonnement-Testpfad deaktiviert die Claude-MCP-/Werkzeug- und Bildprüfungen standardmäßig, weil er die Nutzungskontingente des angemeldeten Abonnements verbraucht und Anthropic das Abrechnungs- sowie Ratenbegrenzungsverhalten des Claude Agent SDK bzw. von `claude -p` ohne eine OpenClaw-Veröffentlichung ändern kann.
- Claude und Gemini unterstützen über die obigen Flags dieselben Prüfungen (Textanfrage, Bildklassifizierung, MCP-Aufruf des Werkzeugs `cron`, Kontinuität beim Modellwechsel), aber keine dieser Prüfungen wird standardmäßig ausgeführt – aktivieren Sie sie bei Bedarf jeweils über das entsprechende Flag.

## Live: Erreichbarkeit von APNs über einen HTTP/2-Proxy

- Test: `src/infra/push-apns-http2.live.test.ts`
- Ziel: Durch einen lokalen HTTP-CONNECT-Proxy eine Verbindung zum Sandbox-APNs-Endpunkt von Apple tunneln, die APNs-HTTP/2-Validierungsanfrage senden und prüfen, ob die echte Antwort `403 InvalidProviderToken` von Apple über den Proxy-Pfad zurückgegeben wird.
- Aktivierung:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionales Zeitlimit:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-Bindungs-Smoke-Test (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den realen ACP-Ablauf zur Konversationsbindung mit einem aktiven ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Konversation eines Nachrichtenkanals direkt binden
  - eine normale Folgenachricht in derselben Konversation senden
  - überprüfen, dass die Folgenachricht im Transkript der gebundenen ACP-Sitzung ankommt
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
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
  - Dieser Testlauf verwendet die Gateway-Oberfläche `chat.send` mit ausschließlich Administratoren vorbehaltenen synthetischen Feldern für die Ursprungsroute, damit Tests einen Nachrichtenkanalkontext anfügen können, ohne eine externe Zustellung vorzutäuschen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agentenregistrierung des eingebetteten Plugins `acpx` für den ausgewählten Agenten des ACP-Testsystems.
  - Die Cron-MCP-Erstellung für gebundene Sitzungen erfolgt standardmäßig nach bestem Bemühen, da externe ACP-Testsysteme MCP-Aufrufe abbrechen können, nachdem der Bindungs-/Bildnachweis erfolgreich war; setzen Sie `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, um diese Cron-Prüfung nach der Bindung strikt durchzuführen.

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

- Das Docker-Ausführungsskript befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt es den ACP-Bindungs-Smoketest nacheinander mit den zusammengefassten aktiven CLI-Agenten aus: `claude`, `codex` und anschließend `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, um die Matrix einzuschränken.
- Es stellt das passende CLI-Authentifizierungsmaterial im Container bereit und installiert anschließend bei Bedarf die angeforderte aktive CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid über `https://app.factory.ai/cli`, `@google/gemini-cli` oder `opencode-ai`). Das ACP-Backend selbst ist das eingebettete Paket `acpx/runtime` aus dem offiziellen Plugin `acpx`.
- Die Docker-Variante für Droid stellt `~/.factory` für Einstellungen bereit, reicht `FACTORY_API_KEY` weiter und erfordert diesen API-Schlüssel, da die lokale Factory-Authentifizierung per OAuth/Schlüsselbund nicht in den Container übertragen werden kann. Sie verwendet den integrierten Registrierungseintrag `droid exec --output-format acp` von ACPX.
- Die Docker-Variante für OpenCode ist ein strikter Regressionstestlauf mit einem einzelnen Agenten. Sie schreibt aus `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` ein temporäres Standardmodell in `OPENCODE_CONFIG_CONTENT` (Standardwert: `opencode/kimi-k2.6`).
- Direkte Aufrufe der CLI `acpx` dienen nur als manueller Ausweichweg zum Vergleichen des Verhaltens außerhalb des Gateways. Der Docker-Smoketest für die ACP-Bindung prüft das eingebettete Laufzeit-Backend `acpx` von OpenClaw.

## Aktivtest: Smoketest des Codex-App-Server-Testsystems

- Ziel: das Plugin-eigene Codex-Testsystem über die normale Gateway-Methode
  `agent` validieren:
  - das gebündelte Plugin `codex` laden
  - über `/model <ref> --runtime codex` ein OpenAI-Modell auswählen
  - einen ersten Gateway-Agentendurchlauf mit der angeforderten Denkstufe senden
  - einen zweiten Durchlauf an dieselbe OpenClaw-Sitzung senden und überprüfen, dass der App-Server-Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehlspfad ausführen
  - optional zwei von Guardian geprüfte Shell-Tests mit erweiterten Berechtigungen ausführen: einen unbedenklichen Befehl, der genehmigt werden sollte, und einen Upload eines fingierten Geheimnisses, der abgelehnt werden sollte, sodass der Agent nachfragt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Basismodell des Testsystems: `openai/gpt-5.6-luna`
- Standardauswahl bei einem neuen OpenAI-API-Schlüssel: `openai/gpt-5.6`
- Standard-Denkstufe: `low`
- Modellüberschreibung: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Überschreibung der Denkstufe: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Matrixüberschreibung: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Authentifizierungsmodus: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (Standardwert) verwendet die
  kopierte Codex-Anmeldung; `api-key` verwendet `OPENAI_API_KEY` über den Codex-App-Server.
- Optionale Bildprüfung: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Werkzeugprüfung: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionale Guardian-Prüfung: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Der Smoketest erzwingt für Provider/Modell `agentRuntime.id: "codex"`, sodass ein defektes Codex-Testsystem nicht unbemerkt bestehen kann, indem es auf OpenClaw zurückfällt.
- Authentifizierung: Authentifizierung des Codex-App-Servers über die lokale Anmeldung des Codex-Abonnements oder
  `OPENAI_API_KEY`, wenn `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` gesetzt ist. Docker kann
  für Abonnementläufe `~/.codex/auth.json` und `~/.codex/config.toml` kopieren.

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

Native Codex-Matrix für GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Standardwert bei einem neuen OpenAI-API-Schlüssel:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Dieser Nachweis lässt `OPENCLAW_LIVE_GATEWAY_MODELS` ungesetzt, ermittelt das Modell über
die Auswahlsschnittstelle für Inferenz beim neuen Onboarding, prüft `openai/gpt-5.6` und führt anschließend
einen echten Gateway-Durchlauf mit diesem ermittelten Modell aus.

Eingebettete OpenClaw-Matrix für GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker-Hinweise:

- Das Docker-Ausführungsskript befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Es reicht `OPENAI_API_KEY` weiter, kopiert vorhandene Authentifizierungsdateien der Codex-CLI, installiert
  `@openai/codex` in ein beschreibbares, eingebundenes npm-Präfix, stellt den Quellbaum bereit und führt anschließend ausschließlich den Aktivtest des Codex-Testsystems aus.
- Docker aktiviert die Bild-, MCP-/Werkzeug- und Guardian-Prüfungen standardmäßig. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, wenn Sie einen enger eingegrenzten Debug-Durchlauf benötigen.
- Docker verwendet dieselbe explizite Codex-Laufzeitkonfiguration, sodass veraltete Aliasse oder ein Rückfall auf OpenClaw
  eine Regression des Codex-Testsystems nicht verbergen können.
- Matrixziele werden nacheinander in einem Container ausgeführt. Das Docker-Skript skaliert sein
  standardmäßiges Zeitlimit von 35 Minuten entsprechend der Anzahl der Ziele; jedes äußere Shell- oder CI-Zeitlimit muss
  dieselbe Gesamtdauer zulassen. Die kanonische CI führt jedes GPT-5.6-Ziel in einem separaten Shard aus.

### Empfohlene Aktivtest-Rezepte

Eng eingegrenzte, explizite Zulassungslisten sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Direktes Profil für kleine Modelle:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Gateway-Profil für kleine Modelle:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama-Cloud-API-Smoketest:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Einzelnes Modell, Gateway-Smoketest:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Werkzeugaufrufe über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Direkter Smoketest für Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Schwerpunkt Google (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Smoketest für adaptives Denken (`qa manual` aus der privaten QA-CLI – erfordert `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` und einen Quellcode-Checkout; siehe [QA-Übersicht](/de/concepts/qa-e2e-automation)):
  - Dynamischer Standardwert für Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamisches Budget für Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Brücke (Agentenendpunkt im Stil von Cloud Code Assist).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrem Computer (separate Authentifizierung und Besonderheiten bei den Werkzeugen).
- Gemini-API im Vergleich zur Gemini-CLI:
  - API: OpenClaw ruft die von Google gehostete Gemini-API über HTTP auf (API-Schlüssel/Profilauthentifizierung); dies ist das, was die meisten Benutzer unter „Gemini“ verstehen.
  - CLI: OpenClaw ruft ein lokales Binärprogramm `gemini` über die Shell auf; es verfügt über eine eigene Authentifizierung und kann sich anders verhalten (Streaming-/Werkzeugunterstützung, Versionsabweichungen).

## Aktivtest: Modellmatrix (abgedeckter Umfang)

Aktivtests müssen explizit aktiviert werden, daher gibt es keine feste „CI-Modellliste“. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (sowie ihr Alias `all`) führen die kuratierte Prioritätsliste aus `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` in `src/agents/live-model-filter.ts` in dieser Prioritätsreihenfolge aus:

| Provider/Modell                               | Hinweise   |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
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

Die kuratierte Liste der **kleinen Modelle** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) aus `SMALL_LIVE_MODEL_PRIORITY`:

| Provider/Modell               |
| ----------------------------- |
| `lmstudio/qwen/qwen3.5-9b`    |
| `vllm/qwen/qwen3-8b`          |
| `sglang/qwen/qwen3-8b`        |
| `ollama/gemma3:4b`            |
| `openrouter/qwen/qwen3.5-9b`  |
| `openrouter/z-ai/glm-5.1`     |
| `openrouter/z-ai/glm-5`       |
| `zai/glm-5.1`                 |

Hinweise zur modernen Liste:

- Die Provider `codex` und `codex-cli` sind vom standardmäßigen modernen Durchlauf ausgeschlossen (sie decken das Verhalten des CLI-Backends bzw. von ACP ab und werden oben separat getestet). `openai/gpt-5.5` selbst wird standardmäßig über das Codex-App-Server-Testsystem geleitet; siehe [Live: Smoke-Test des Codex-App-Server-Testsystems](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` und `xai` führen im modernen Durchlauf nur ihre ausdrücklich kuratierten Modell-IDs aus (keine automatische Erweiterung auf „jedes Modell dieses Providers“).
- Nehmen Sie mindestens ein bildfähiges Modell (Vision-Varianten der Claude-, Gemini- oder OpenAI-Familie usw.) in `OPENCLAW_LIVE_GATEWAY_MODELS` auf, um die Bildprüfung auszuführen.

Führen Sie den Gateway-Smoke-Test mit Tools und Bild für eine manuell ausgewählte, Provider-übergreifende Gruppe aus:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Optionale zusätzliche Abdeckung außerhalb der kuratierten Listen (wünschenswert; wählen Sie ein für „Tools“ geeignetes Modell, das Sie aktiviert haben):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (wenn Sie Zugriff haben)
- LM Studio: `lmstudio/...` (lokal; Tool-Aufrufe hängen vom API-Modus ab)

### Aggregatoren / alternative Gateways

Wenn Sie Schlüssel aktiviert haben, können Sie auch über Folgendes testen:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bildunterstützung zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Zugangsdaten bzw. eine Konfiguration haben):

- Integriert: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie beliebige OpenAI-/Anthropic-kompatible Proxys (LM Studio, vLLM, LiteLLM usw.)

<Tip>
Tragen Sie in der Dokumentation nicht „alle Modelle“ fest ein. Maßgeblich ist die Liste, die `discoverModels(...)` auf Ihrem Rechner zurückgibt, zusammen mit den jeweils verfügbaren Schlüsseln.
</Tip>

## Zugangsdaten (niemals committen)

Live-Tests ermitteln Zugangsdaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten die Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „no creds“ meldet, führen Sie die Fehlersuche genauso durch wie bei `openclaw models list` bzw. der Modellauswahl.

- Agent-spezifische Authentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (darauf bezieht sich „profile keys“ in den Live-Tests)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Veraltetes OAuth-Verzeichnis: `~/.openclaw/credentials/` (wird, sofern vorhanden, in das bereitgestellte Live-Ausgangsverzeichnis kopiert, ist jedoch nicht der primäre Speicher für Profilschlüssel)
- Lokale Live-Ausführungen kopieren die aktive Konfiguration (wobei Überschreibungen für `agents.*.workspace` / `agentDir` entfernt werden) und die Datei `auth-profiles.json` jedes Agents – nicht den übrigen Inhalt des jeweiligen Agent-Verzeichnisses, sodass Daten aus `workspace/` und `sandboxes/` niemals in das bereitgestellte Ausgangsverzeichnis gelangen – sowie das veraltete Verzeichnis `credentials/` und unterstützte Authentifizierungsdateien bzw. -verzeichnisse externer CLIs (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) in ein temporäres Test-Ausgangsverzeichnis.

Wenn Sie Umgebungsschlüssel verwenden möchten, exportieren Sie sie vor lokalen Tests oder verwenden Sie die nachstehenden Docker-Ausführungsprogramme mit einer ausdrücklich angegebenen Datei `OPENCLAW_PROFILE_FILE`.

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
  - Führt die gebündelten Comfy-Pfade für Bilder, Videos und `music_generate` aus
  - Überspringt jede Funktion, sofern `plugins.entries.comfy.config.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an der Übermittlung von Comfy-Workflows, an Abfragen, Downloads oder der Plugin-Registrierung

## Bilderzeugung live

- Test: `test/image-generation.runtime.live.test.ts`
- Befehl: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Testsystem: `pnpm test:live:media image`
- Umfang:
  - Erfasst jedes registrierte Provider-Plugin für die Bilderzeugung
  - Verwendet bereits exportierte Provider-Umgebungsvariablen vor der Prüfung
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, sodass veraltete Testschlüssel in `auth-profiles.json` keine echten Shell-Zugangsdaten verdecken
  - Überspringt Provider ohne verwendbare Authentifizierung, verwendbares Profil oder Modell
  - Führt jeden konfigurierten Provider über die gemeinsame Bilderzeugungs-Laufzeit aus:
    - `<provider>:generate`
    - `<provider>:edit`, wenn der Provider Unterstützung für die Bearbeitung deklariert
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Authentifizierung über den Profilspeicher zu erzwingen und ausschließlich umgebungsbasierte Überschreibungen zu ignorieren

Fügen Sie für den ausgelieferten CLI-Pfad einen `infer`-Smoke-Test hinzu, nachdem der Live-Test für Provider/Laufzeit erfolgreich war:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dies deckt die Analyse der CLI-Argumente, die Auflösung der Konfiguration bzw. des Standard-Agents, die Aktivierung gebündelter Plugins, die gemeinsame Bilderzeugungs-Laufzeit und die Live-Anfrage an den Provider ab. Es wird erwartet, dass Plugin-Abhängigkeiten vor dem Laden der Laufzeit vorhanden sind.

## Musikerzeugung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Testsystem: `pnpm test:live:media music`
- Umfang:
  - Führt den gemeinsamen Pfad der gebündelten Provider für die Musikerzeugung aus
  - Deckt derzeit `fal`, `google`, `minimax` und `openrouter` ab
  - Verwendet bereits exportierte Provider-Umgebungsvariablen vor der Prüfung
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, sodass veraltete Testschlüssel in `auth-profiles.json` keine echten Shell-Zugangsdaten verdecken
  - Überspringt Provider ohne verwendbare Authentifizierung, verwendbares Profil oder Modell
  - Führt beide deklarierten Laufzeitmodi aus, sofern verfügbar:
    - `generate` mit einer Eingabe, die nur eine Eingabeaufforderung enthält
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - `comfy` verfügt über eine eigene separate Live-Datei und ist nicht Teil dieses gemeinsamen Durchlaufs
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Authentifizierung über den Profilspeicher zu erzwingen und ausschließlich umgebungsbasierte Überschreibungen zu ignorieren

## Videoerzeugung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Test-Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen Pfad der gebündelten Provider für die Videogenerierung über `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Verwendet standardmäßig den releasesicheren Smoke-Test-Pfad: eine Text-zu-Video-Anfrage pro Provider, einen einsekündigen Hummer-Prompt und ein Zeitlimit pro Provider-Vorgang aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, da die providerseitige Warteschlangenlatenz die Release-Dauer dominieren kann; übergeben Sie `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (oder leeren Sie die Überspringen-Liste), um den Test ausdrücklich auszuführen
  - Verwendet vor der Prüfung bereits exportierte Provider-Umgebungsvariablen
  - Verwendet standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne verwendbare Authentifizierung, verwendbares Profil oder verwendbares Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transformationsmodi auszuführen, sofern verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider beziehungsweise das ausgewählte Modell im gemeinsamen Testlauf lokale, puffergestützte Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider beziehungsweise das ausgewählte Modell im gemeinsamen Testlauf lokale, puffergestützte Videoeingaben akzeptiert
  - Derzeit deklarierter, aber im gemeinsamen Testlauf übersprungener `imageToVideo`-Provider:
    - `vydra` (puffergestützte lokale Bildeingaben werden in diesem Testlauf nicht unterstützt)
  - Providerspezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Diese Datei führt `veo3` für Text-zu-Video sowie einen `kling`-Testlauf für Bild-zu-Video aus, der standardmäßig eine Fixture mit einer Remote-Bild-URL verwendet (zum Überschreiben `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`).
  - Providerspezifische xAI-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Der klassische Fall generiert ein quadratisches lokales PNG als erstes Einzelbild, lässt Geometrieangaben weg, fordert einen einsekündigen Bild-zu-Video-Clip an, fragt den Status bis zum Abschluss ab und überprüft den heruntergeladenen Puffer.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Der 1.5-Fall generiert ein lokales PNG als erstes Einzelbild, fordert einen einsekündigen 1080P-Bild-zu-Video-Clip an, fragt den Status bis zum Abschluss ab und überprüft den heruntergeladenen Puffer.
  - Aktuelle Live-Abdeckung für `videoToVideo`:
    - `runway` nur, wenn das ausgewählte Modell zu `gen4_aleph` aufgelöst wird
  - Derzeit deklarierte, aber im gemeinsamen Testlauf übersprungene `videoToVideo`-Provider:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, da diese Pfade derzeit Remote-Referenz-URLs mit `http(s)` anstelle puffergestützter lokaler Eingaben erfordern
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den standardmäßigen Testlauf einzubeziehen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Zeitlimit jedes Provider-Vorgangs für einen aggressiven Smoke-Test zu reduzieren
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um die Authentifizierung über den Profilspeicher zu erzwingen und ausschließlich über Umgebungsvariablen bereitgestellte Überschreibungen zu ignorieren

## Live-Test-Harness für Medien

- Befehl: `pnpm test:live:media`
- Einstiegspunkt: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, der pro ausgewählter Testsuite `pnpm test:live -- <suite-test-file>` ausführt, sodass das Heartbeat- und Ruhemodus-Verhalten mit anderen `pnpm test:live`-Ausführungen konsistent bleibt.
- Zweck:
  - Führt die gemeinsamen Live-Testsuites für Bilder, Musik und Videos über einen einzigen repo-eigenen Einstiegspunkt aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt jede Testsuite standardmäßig automatisch auf Provider ein, für die derzeit eine verwendbare Authentifizierung vorliegt
- Optionen:
  - `--providers <csv>` globaler Provider-Filter; `--image-providers` / `--music-providers` / `--video-providers` beschränken einen Filter auf eine Testsuite
  - `--all-providers` überspringt den authentifizierungsbasierten automatischen Filter
  - `--allow-empty` beendet den Vorgang mit `0`, wenn nach der Filterung keine ausführbaren Provider verbleiben
  - `--quiet` / `--no-quiet` werden an `test:live` weitergegeben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Verwandte Themen

- [Tests](/de/help/testing) – Unit-, Integrations-, QA- und Docker-Testsuites
