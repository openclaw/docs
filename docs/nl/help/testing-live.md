---
read_when:
    - Live-modelmatrix / CLI-backend / ACP / mediaprovider-smoketests uitvoeren
    - Foutopsporing bij het bepalen van live-testreferenties
    - Een nieuwe provider-specifieke live-test toevoegen
sidebarTitle: Live tests
summary: 'Live-tests (met netwerktoegang): modelmatrix, CLI-backends, ACP, mediaproviders, referenties'
title: 'Testen: live-suites'
x-i18n:
    generated_at: "2026-06-27T17:40:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Voor snelle start, QA-runners, unit-/integratiesuites en Docker-flows, zie
[Testen](/nl/help/testing). Deze pagina behandelt de **live** testsuites (met netwerktoegang):
modelmatrix, CLI-backends, ACP en live tests voor mediaproviders, plus
credentialbeheer.

## Live: lokale smoke-opdrachten

Exporteer de benodigde providersleutel in de procesomgeving voordat je ad-hoc live
controles uitvoert.

Veilige media-smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Veilige readiness-smoke voor voice-calls:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` is een proefuitvoering tenzij `--yes` ook aanwezig is. Gebruik `--yes` alleen
wanneer je bewust een echte notificatiecall wilt plaatsen. Voor Twilio, Telnyx en
Plivo vereist een geslaagde readiness-controle een openbare webhook-URL; lokale
loopback-/private fallbacks worden bewust geweigerd.

## Live: capabilities-sweep voor Android-node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: **elke opdracht die momenteel wordt geadverteerd** door een verbonden Android-node aanroepen en het gedrag van het opdrachtcontract controleren.
- Scope:
  - Vooraf geconditioneerde/handmatige setup (de suite installeert/start/koppelt de app niet).
  - Gateway-`node.invoke`-validatie per opdracht voor de geselecteerde Android-node.
- Vereiste voorafgaande setup:
  - Android-app is al verbonden en gekoppeld aan de gateway.
  - App blijft op de voorgrond.
  - Rechten/capture-toestemming verleend voor capabilities waarvan je verwacht dat ze slagen.
- Optionele doel-overschrijvingen:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige Android-setupdetails: [Android-app](/nl/platforms/android)

## Live: model-smoke (profielsleutels)

Live tests zijn opgesplitst in twee lagen zodat we fouten kunnen isoleren:

- "Direct model" vertelt ons of de provider/het model überhaupt kan antwoorden met de gegeven sleutel.
- "Gateway smoke" vertelt ons of de volledige gateway+agent-pijplijn werkt voor dat model (sessies, geschiedenis, tools, sandboxbeleid, enz.).

### Laag 1: Directe modelaanvulling (geen gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen inventariseren
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor je credentials hebt
  - Een kleine aanvulling per model uitvoeren (en gerichte regressies waar nodig)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Stel `OPENCLAW_LIVE_MODELS=modern`, `small` of `all` (alias voor modern) in om deze suite daadwerkelijk uit te voeren; anders slaat hij over om `pnpm test:live` gericht te houden op gateway-smoke
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` om de moderne allowlist uit te voeren (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` om de beperkte allowlist voor kleine modellen uit te voeren (Qwen 8B/9B lokaal compatibele routes, Ollama Gemma, OpenRouter Qwen/GLM en Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor de moderne allowlist
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist met komma's)
  - Lokale Ollama-runs met kleine modellen gebruiken standaard `http://127.0.0.1:11434`; stel `OPENCLAW_LIVE_OLLAMA_BASE_URL` alleen in voor LAN-, aangepaste of Ollama Cloud-endpoints.
  - Moderne/all- en small-sweeps gebruiken standaard hun samengestelde limieten; stel `OPENCLAW_LIVE_MAX_MODELS=0` in voor een uitputtende sweep van geselecteerde profielen of een positief getal voor een kleinere limiet.
  - Uitputtende sweeps gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` voor de timeout van de volledige directe-modeltest. Standaard: 60 minuten.
  - Directe-modelprobes draaien standaard met parallelisme van 20; stel `OPENCLAW_LIVE_MODEL_CONCURRENCY` in om dit te overschrijven.
- Providers selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist met komma's)
- Waar sleutels vandaan komen:
  - Standaard: profielopslag en env-fallbacks
  - Stel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` in om alleen **profielopslag** af te dwingen
- Waarom dit bestaat:
  - Scheidt "provider-API is kapot / sleutel is ongeldig" van "gateway-agentpijplijn is kapot"
  - Bevat kleine, geïsoleerde regressies (voorbeeld: OpenAI Responses/Codex Responses reasoning replay + tool-call-flows)

### Laag 2: Gateway + dev-agent-smoke (wat "@openclaw" daadwerkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een in-process gateway starten
  - Een `agent:dev:*`-sessie maken/patchen (modeloverschrijving per run)
  - Modellen-met-sleutels itereren en controleren:
    - "betekenisvolle" respons (geen tools)
    - een echte toolaanroep werkt (read-probe)
    - optionele extra toolprobes (exec+read-probe)
    - OpenAI-regressiepaden (alleen tool-call → follow-up) blijven werken
- Probedetails (zodat je fouten snel kunt verklaren):
  - `read`-probe: de test schrijft een nonce-bestand in de workspace en vraagt de agent het te `read` en de nonce terug te echoën.
  - `exec+read`-probe: de test vraagt de agent met `exec` een nonce naar een tijdelijk bestand te schrijven en het daarna terug te `read`.
  - afbeeldingsprobe: de test voegt een gegenereerde PNG toe (kat + willekeurige code) en verwacht dat het model `cat <CODE>` retourneert.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `test/helpers/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Modellen selecteren:
  - Standaard: moderne allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` om dezelfde beperkte allowlist voor kleine modellen via de volledige gateway+agent-pijplijn uit te voeren
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor de moderne allowlist
  - Of stel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (of kommagescheiden lijst) in om te beperken
  - Moderne/all- en small-gateway-sweeps gebruiken standaard hun samengestelde limieten; stel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` in voor een uitputtende geselecteerde sweep of een positief getal voor een kleinere limiet.
- Providers selecteren (voorkom "alles van OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist met komma's)
- Tool- en afbeeldingsprobes staan altijd aan in deze live test:
  - `read`-probe + `exec+read`-probe (toolstress)
  - afbeeldingsprobe draait wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (op hoofdlijnen):
    - Test genereert een kleine PNG met "CAT" + willekeurige code (`test/helpers/live-image-probe.ts`)
    - Stuurt die via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parset bijlagen naar `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Ingebedde agent stuurt een multimodaal gebruikersbericht door naar het model
    - Assertie: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten toegestaan)

<Tip>
Om te zien wat je op je machine kunt testen (en de exacte `provider/model`-id's), voer je uit:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-backend-smoke (Claude, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: de Gateway + agent-pijplijn valideren met een lokale CLI-backend, zonder je standaardconfiguratie aan te raken.
- Backend-specifieke smoke-standaarden staan in de `cli-backend.ts`-definitie van de beherende extensie.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaarden:
  - Standaardprovider/-model: `claude-cli/claude-sonnet-4-6`
  - Opdracht-/args-/afbeeldingsgedrag komt uit de Plugin-metadata van de beherende CLI-backend.
- Overschrijvingen (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeeldingsbijlage te sturen (paden worden in de prompt geïnjecteerd). Docker-recepten zetten dit standaard uit tenzij expliciet gevraagd.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-args door te geven in plaats van promptinjectie.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te bepalen hoe afbeeldingsargs worden doorgegeven wanneer `IMAGE_ARG` is ingesteld.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te sturen en de resume-flow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om expliciet deel te nemen aan de continuïteitsprobe Claude Sonnet -> Opus binnen dezelfde sessie wanneer het geselecteerde model een switchdoel ondersteunt. Docker-recepten zetten dit standaard uit voor geaggregeerde betrouwbaarheid.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om expliciet deel te nemen aan de MCP/tool-loopbackprobe. Docker-recepten zetten dit standaard uit tenzij expliciet gevraagd.

Voorbeeld:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Goedkope Gemini MCP-config-smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dit vraagt Gemini niet om een respons te genereren. Het schrijft dezelfde systeeminstellingen
die OpenClaw aan Gemini geeft en voert daarna `gemini --debug mcp list` uit om te bewijzen dat een
opgeslagen `transport: "streamable-http"`-server wordt genormaliseerd naar Gemini's HTTP MCP-vorm
en verbinding kan maken met een lokale streamable-HTTP MCP-server.

Docker-recept:

```bash
pnpm test:docker:live-cli-backend
```

Docker-recepten voor één provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Notities:

- De Docker-runner staat op `scripts/test-live-cli-backend-docker.sh`.
- Hij draait de live CLI-backend-smoke binnen de repo-Docker-image als de niet-rootgebruiker `node`.
- Hij resolveert CLI-smoke-metadata uit de beherende extensie en installeert daarna het bijpassende Linux CLI-pakket (`@anthropic-ai/claude-code` of `@google/gemini-cli`) in een gecachete schrijfbare prefix op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist portable Claude Code-subscription-OAuth via `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` of `CLAUDE_CODE_OAUTH_TOKEN` van `claude setup-token`. Het bewijst eerst directe `claude -p` in Docker en voert daarna twee Gateway CLI-backend-beurten uit zonder Anthropic API-key-env-vars te behouden. Deze subscription-lane schakelt de Claude MCP/tool- en afbeeldingsprobes standaard uit, omdat Claude gebruik door apps van derden momenteel via extra-gebruiksfacturering routeert in plaats van via normale subscription-planlimieten.
- De live CLI-backend-smoke test nu dezelfde end-to-end-flow voor Claude en Gemini: tekstbeurt, afbeeldingsclassificatiebeurt en daarna MCP-`cron`-toolaanroep geverifieerd via de gateway-CLI.
- Claude's standaard-smoke patcht ook de sessie van Sonnet naar Opus en verifieert dat de hervatte sessie nog steeds een eerdere notitie onthoudt.

## Live: APNs HTTP/2-proxybereikbaarheid

- Test: `src/infra/push-apns-http2.live.test.ts`
- Doel: via een lokale HTTP CONNECT-proxy naar Apple's sandbox-APNs-endpoint tunnelen, de APNs HTTP/2-validatieaanvraag sturen en controleren dat Apple's echte `403 InvalidProviderToken`-respons via het proxypad terugkomt.
- Inschakelen:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionele timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-bind-smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: valideer de echte ACP conversation-bind-flow met een live ACP-agent:
  - verstuur `/acp spawn <agent> --bind here`
  - bind een synthetisch message-channel-gesprek op zijn plaats
  - verstuur een normale opvolging in datzelfde gesprek
  - controleer of de opvolging in het transcript van de gebonden ACP-sessie terechtkomt
- Inschakelen:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standaardwaarden:
  - ACP-agenten in Docker: `claude,codex,gemini`
  - ACP-agent voor directe `pnpm test:live ...`: `claude`
  - Synthetisch kanaal: Slack DM-achtige gesprekscontext
  - ACP-backend: `acpx`
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
- Opmerkingen:
  - Deze lane gebruikt het Gateway-`chat.send`-oppervlak met admin-only synthetische originating-route-velden, zodat tests message-channel-context kunnen koppelen zonder te doen alsof er extern wordt geleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test de ingebouwde agentregistry van de ingebedde `acpx`-Plugin voor de geselecteerde ACP-harness-agent.
  - Cron MCP-creatie voor gebonden sessies is standaard best-effort, omdat externe ACP-harnesses MCP-aanroepen kunnen annuleren nadat het bind-/image-bewijs is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die post-bind Cron-probe strikt te maken.

Voorbeeld:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-recept:

```bash
pnpm test:docker:live-acp-bind
```

Docker-recepten voor één agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker-opmerkingen:

- De Docker-runner staat op `scripts/test-live-acp-bind-docker.sh`.
- Standaard voert hij de ACP-bind-smoketest achtereenvolgens uit tegen de geaggregeerde live CLI-agenten: `claude`, `codex` en daarna `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Hij plaatst het overeenkomende CLI-auth-materiaal in de container en installeert daarna de gevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` of `opencode-ai`) als die ontbreekt. De ACP-backend zelf is het ingebedde `acpx/runtime`-pakket uit de officiële `acpx`-Plugin.
- De Droid Docker-variant plaatst `~/.factory` voor instellingen, geeft `FACTORY_API_KEY` door en vereist die API-sleutel omdat lokale Factory OAuth-/keyring-auth niet overdraagbaar is naar de container. Hij gebruikt de ingebouwde `droid exec --output-format acp`-registry-entry van ACPX.
- De OpenCode Docker-variant is een strikte regressielane voor één agent. Hij schrijft een tijdelijk standaardmodel in `OPENCODE_CONFIG_CONTENT` vanuit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`), en `pnpm test:docker:live-acp-bind:opencode` vereist een gebonden assistenttranscript in plaats van de generieke post-bind-skip te accepteren.
- Directe `acpx` CLI-aanroepen zijn alleen een handmatig/workaround-pad om gedrag buiten de Gateway te vergelijken. De Docker ACP-bind-smoketest oefent OpenClaw's ingebedde `acpx` runtime-backend.

## Live: Codex app-server-harness-smoketest

- Doel: valideer de Plugin-eigen Codex-harness via de normale Gateway-
  `agent`-methode:
  - laad de gebundelde `codex`-Plugin
  - selecteer `openai/gpt-5.5`, waarmee OpenAI-agentbeurten standaard via Codex worden gerouteerd
  - verstuur een eerste Gateway-agentbeurt naar `openai/gpt-5.5` met de Codex-harness geselecteerd
  - verstuur een tweede beurt naar dezelfde OpenClaw-sessie en controleer of de app-server-
    thread kan hervatten
  - voer `/codex status` en `/codex models` uit via hetzelfde Gateway-commandopad
  - voer optioneel twee door Guardian beoordeelde geëscaleerde shell-probes uit: één onschuldige
    command die zou moeten worden goedgekeurd en één nep-secret-upload die zou moeten worden
    geweigerd zodat de agent terugvraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standaardmodel: `openai/gpt-5.5`
- Optionele image-probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP-/toolprobe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoketest forceert provider/model `agentRuntime.id: "codex"`, zodat een kapotte Codex-
  harness niet kan slagen door stilzwijgend terug te vallen op OpenClaw.
- Auth: Codex app-server-auth via de lokale Codex-abonnementslogin. Docker-
  smoketests kunnen ook `OPENAI_API_KEY` leveren voor niet-Codex-probes waar van toepassing,
  plus optioneel gekopieerde `~/.codex/auth.json` en `~/.codex/config.toml`.

Lokaal recept:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-recept:

```bash
pnpm test:docker:live-codex-harness
```

Docker-opmerkingen:

- De Docker-runner staat op `scripts/test-live-codex-harness-docker.sh`.
- Hij geeft `OPENAI_API_KEY` door, kopieert Codex CLI-auth-bestanden wanneer aanwezig, installeert
  `@openai/codex` in een beschrijfbare aangekoppelde npm-
  prefix, plaatst de source tree en voert daarna alleen de live Codex-harness-test uit.
- Docker schakelt de image-, MCP-/tool- en Guardian-probes standaard in. Stel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer je een beperktere debug-
  run nodig hebt.
- Docker gebruikt dezelfde expliciete Codex-runtimeconfiguratie, zodat legacy aliassen of OpenClaw-
  fallback een Codex-harness-regressie niet kunnen verbergen.

### Aanbevolen live-recepten

Smalle, expliciete allowlists zijn het snelst en het minst flaky:

- Eén model, direct (geen Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Direct profiel voor klein model:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Gateway-profiel voor klein model:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API-smoketest:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Eén model, Gateway-smoketest:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Toolaanroepen over meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 directe smoketest:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google-focus (Gemini API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-smoketest voor adaptive thinking:
  - Gemini 3 dynamische standaard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisch budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Opmerkingen:

- `google/...` gebruikt de Gemini API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity OAuth-bridge (Cloud Code Assist-achtige agentendpoint).
- `google-gemini-cli/...` gebruikt de lokale Gemini CLI op je machine (aparte auth + tooling-eigenaardigheden).
- Gemini API versus Gemini CLI:
  - API: OpenClaw roept Google's gehoste Gemini API aan via HTTP (API-sleutel / profielauth); dit is wat de meeste gebruikers bedoelen met "Gemini".
  - CLI: OpenClaw voert een lokale `gemini`-binary uit; die heeft eigen auth en kan zich anders gedragen (streaming-/toolondersteuning/versiescheefloop).

## Live: modelmatrix (wat we dekken)

Er is geen vaste "CI-modellijst" (live is opt-in), maar dit zijn de **aanbevolen** modellen om regelmatig te dekken op een ontwikkelmachine met sleutels.

### Moderne smoketestset (toolaanroepen + image)

Dit is de run met "algemene modellen" waarvan we verwachten dat die blijft werken:

- OpenAI (niet-Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` en `google/gemini-3-flash-preview` (vermijd oudere Gemini 2.x-modellen)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` en `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (algemene API) of `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Voer Gateway-smoketest uit met tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: toolaanroepen (Read + optionele Exec)

Kies ten minste één per providerfamilie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (of `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (algemene API) of `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Optionele extra dekking (mooi om te hebben):

- xAI: `xai/grok-4.3` (of nieuwste beschikbare)
- Mistral: `mistral/`… (kies één model met "tools"-mogelijkheden dat je hebt ingeschakeld)
- Cerebras: `cerebras/`… (als je toegang hebt)
- LM Studio: `lmstudio/`… (lokaal; toolaanroepen hangen af van de API-modus)

### Vision: image verzenden (bijlage → multimodaal bericht)

Neem ten minste één model met image-mogelijkheden op in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude-/Gemini-/OpenAI-varianten met vision-mogelijkheden, enz.) om de image-probe te oefenen.

### Aggregators / alternatieve gateways

Als je sleutels hebt ingeschakeld, ondersteunen we ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten met tool- en image-mogelijkheden te vinden)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die je kunt opnemen in de live matrix (als je credentials/config hebt):

- Ingebouwd: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (aangepaste endpoints): `minimax` (cloud/API), plus elke OpenAI/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM, enz.)

<Tip>
Hardcode "alle modellen" niet in docs. De gezaghebbende lijst is wat `discoverModels(...)` op je machine teruggeeft, plus alle beschikbare sleutels.
</Tip>

## Credentials (nooit committen)

Live tests ontdekken credentials op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, moeten live tests dezelfde sleutels vinden.
- Als een live test "no creds" meldt, debug dit dan op dezelfde manier als `openclaw models list` / modelselectie.

- Auth-profielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit is wat "profile keys" betekent in de live tests)
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Verouderde state-directory: `~/.openclaw/credentials/` (wordt naar de staged live home gekopieerd wanneer aanwezig, maar is niet de hoofdopslag voor profielsleutels)
- Live lokale runs kopiëren standaard de actieve configuratie, `auth-profiles.json`-bestanden per agent, verouderde `credentials/` en ondersteunde externe CLI-auth-directories naar een tijdelijke test-home; staged live homes slaan `workspace/` en `sandboxes/` over, en pad-overschrijvingen voor `agents.*.workspace` / `agentDir` worden gestript zodat probes van je echte host-workspace wegblijven.

Als je op env-sleutels wilt vertrouwen, exporteer ze dan vóór lokale tests of gebruik de
Docker-runners hieronder met een expliciet `OPENCLAW_PROFILE_FILE`.

## Deepgram live (audiotranscriptie)

- Test: `extensions/deepgram/audio.live.test.ts`
- Inschakelen: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-codingplan live

- Test: `extensions/byteplus/live.test.ts`
- Inschakelen: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionele model-override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-workflowmedia live

- Test: `extensions/comfy/comfy.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Scope:
  - Oefent de gebundelde comfy-paden voor afbeeldingen, video en `music_generate`
  - Slaat elke capability over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen aan comfy-workflowindiening, polling, downloads of Plugin-registratie

## Afbeeldingen genereren live

- Test: `test/image-generation.runtime.live.test.ts`
- Commando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Scope:
  - Somt elke geregistreerde provider-Plugin voor afbeeldingen genereren op
  - Gebruikt al geëxporteerde provider-env-vars vóór probing
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-credentials niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert elke geconfigureerde provider uit via de gedeelde runtime voor afbeeldingen genereren:
    - `<provider>:generate`
    - `<provider>:edit` wanneer de provider bewerkingsondersteuning declareert
- Huidige gebundelde providers die worden gedekt:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Optionele versmalling:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth uit de profielopslag af te dwingen en overrides die alleen uit env komen te negeren

Voeg voor het verzonden CLI-pad een `infer`-smoke toe nadat de provider/runtime-live
test slaagt:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dit dekt CLI-argumentparsing, resolutie van config/default-agent, activatie van gebundelde
Plugin, de gedeelde runtime voor afbeeldingen genereren en het live provider-
request. Plugin-afhankelijkheden worden verwacht aanwezig te zijn vóór runtime-load.

## Muziek genereren live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Scope:
  - Oefent het gedeelde pad voor gebundelde providers voor muziek genereren
  - Dekt momenteel Google en MiniMax
  - Gebruikt al geëxporteerde provider-env-vars vóór probing
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-credentials niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert beide gedeclareerde runtime-modi uit wanneer beschikbaar:
    - `generate` met invoer met alleen prompt
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - Huidige dekking van de gedeelde lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: apart Comfy-livebestand, niet deze gedeelde sweep
- Optionele versmalling:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth uit de profielopslag af te dwingen en overrides die alleen uit env komen te negeren

## Video genereren live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Scope:
  - Oefent het gedeelde pad voor gebundelde providers voor video genereren
  - Gebruikt standaard het release-veilige smoke-pad: niet-FAL-providers, één text-to-video-request per provider, lobster-prompt van één seconde en een operation cap per provider uit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`)
  - Slaat FAL standaard over omdat wachtrijlatentie aan providerzijde releasetijd kan domineren; geef `--video-providers fal` of `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` door om dit expliciet uit te voeren
  - Gebruikt al geëxporteerde provider-env-vars vóór probing
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-credentials niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transform-modi uit te voeren wanneer beschikbaar:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokale afbeeldingsinvoer met bufferbacking accepteert in de gedeelde sweep
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokale video-invoer met bufferbacking accepteert in de gedeelde sweep
  - Huidige gedeclareerde maar overgeslagen `imageToVideo`-providers in de gedeelde sweep:
    - `vydra` omdat gebundelde `veo3` alleen tekst ondersteunt en gebundelde `kling` een externe afbeeldings-URL vereist
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - dat bestand voert `veo3` text-to-video uit plus een `kling`-lane die standaard een externe afbeeldings-URL-fixture gebruikt
  - Huidige `videoToVideo`-live-dekking:
    - alleen `runway` wanneer het geselecteerde model `runway/gen4_aleph` is
  - Huidige gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde sweep:
    - `alibaba`, `qwen`, `xai` omdat die paden momenteel externe `http(s)` / MP4-referentie-URL's vereisen
    - `google` omdat de huidige gedeelde Gemini/Veo-lane lokale invoer met bufferbacking gebruikt en dat pad niet wordt geaccepteerd in de gedeelde sweep
    - `openai` omdat de huidige gedeelde lane garanties voor organisatiespecifieke toegang tot videobewerking mist
- Optionele versmalling:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaardsweep op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de operation cap per provider te verlagen voor een agressieve smoke-run
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth uit de profielopslag af te dwingen en overrides die alleen uit env komen te negeren

## Media-liveharness

- Commando: `pnpm test:live:media`
- Doel:
  - Voert de gedeelde live suites voor afbeeldingen, muziek en video uit via één repo-native entrypoint
  - Gebruikt al geëxporteerde provider-env-vars
  - Versmalt elke suite standaard automatisch tot providers die momenteel bruikbare auth hebben
  - Hergebruikt `scripts/test-live.mjs`, zodat Heartbeat- en quiet-mode-gedrag consistent blijven
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) - unit-, integratie-, QA- en Docker-suites
