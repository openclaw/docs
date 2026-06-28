---
read_when:
    - Live modelmatrix / CLI-backend / ACP / media-provider-smokes uitvoeren
    - Het bepalen van live-testinloggegevens debuggen
    - Een nieuwe providerspecifieke live-test toevoegen
sidebarTitle: Live tests
summary: 'Live (netwerkgebruikende) tests: modelmatrix, CLI-backends, ACP, mediaproviders, inloggegevens'
title: 'Testen: live suites'
x-i18n:
    generated_at: "2026-06-28T20:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

Zie voor snelstart, QA-runners, unit-/integratiesuites en Docker-flows
[Tests](/nl/help/testing). Deze pagina behandelt de **live** testsuites (met netwerkverkeer):
modelmatrix, CLI-backends, ACP en live tests voor mediaproviders, plus
credentialbeheer.

## Live: lokale smoke-opdrachten

Exporteer de benodigde providersleutel in de procesomgeving voordat je ad-hoc live
controles uitvoert.

Veilige media-smoketest:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Veilige smoketest voor gereedheid van spraakoproepen:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` is een dry run tenzij `--yes` ook aanwezig is. Gebruik `--yes` alleen
wanneer je bewust een echte notificatieoproep wilt plaatsen. Voor Twilio, Telnyx en
Plivo vereist een geslaagde gereedheidscontrole een openbare webhook-URL; fallbacks
voor alleen lokale loopback/privéverkeer worden bewust geweigerd.

## Live: capability-sweep voor Android-Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: **elke opdracht die momenteel wordt geadverteerd** door een verbonden Android-Node aanroepen en het contractgedrag van de opdracht controleren.
- Scope:
  - Vooraf geconditioneerde/handmatige setup (de suite installeert/start/koppelt de app niet).
  - Gateway-`node.invoke`-validatie per opdracht voor de geselecteerde Android-Node.
- Vereiste voorafgaande setup:
  - Android-app is al verbonden en gekoppeld aan de Gateway.
  - App blijft op de voorgrond.
  - Machtigingen/toestemming voor vastleggen zijn verleend voor capabilities waarvan je verwacht dat ze slagen.
- Optionele doeloverschrijvingen:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige Android-setupdetails: [Android-app](/nl/platforms/android)

## Live: model-smoketest (profielsleutels)

Live tests zijn opgesplitst in twee lagen zodat we fouten kunnen isoleren:

- "Rechtstreeks model" vertelt ons of de provider/het model met de gegeven sleutel uberhaupt kan antwoorden.
- "Gateway-smoketest" vertelt ons of de volledige Gateway+agent-pijplijn voor dat model werkt (sessies, geschiedenis, tools, sandboxbeleid, enzovoort).

### Laag 1: Rechtstreekse modelvoltooiing (geen Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen opsommen
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor je credentials hebt
  - Een kleine voltooiing per model uitvoeren (en gerichte regressies waar nodig)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Stel `OPENCLAW_LIVE_MODELS=modern`, `small` of `all` (alias voor modern) in om deze suite daadwerkelijk uit te voeren; anders wordt deze overgeslagen zodat `pnpm test:live` gericht blijft op Gateway-smoketests
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` om de moderne toelatingslijst uit te voeren (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` om de beperkte toelatingslijst voor kleine modellen uit te voeren (Qwen 8B/9B lokaal-compatibele routes, Ollama Gemma, OpenRouter Qwen/GLM en Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor de moderne toelatingslijst
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (toelatingslijst met komma's)
  - Lokale Ollama-runs met kleine modellen gebruiken standaard `http://127.0.0.1:11434`; stel `OPENCLAW_LIVE_OLLAMA_BASE_URL` alleen in voor LAN-, aangepaste of Ollama Cloud-endpoints.
  - Modern/all- en small-sweeps gebruiken standaard hun samengestelde limieten; stel `OPENCLAW_LIVE_MAX_MODELS=0` in voor een uitputtende sweep van het geselecteerde profiel of een positief getal voor een kleinere limiet.
  - Uitputtende sweeps gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` voor de timeout van de volledige test met rechtstreekse modellen. Standaard: 60 minuten.
  - Probes voor rechtstreekse modellen draaien standaard met 20-voudige parallelliteit; stel `OPENCLAW_LIVE_MODEL_CONCURRENCY` in om dit te overschrijven.
- Providers selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (toelatingslijst met komma's)
- Waar sleutels vandaan komen:
  - Standaard: profielopslag en env-fallbacks
  - Stel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` in om uitsluitend **profielopslag** af te dwingen
- Waarom dit bestaat:
  - Scheidt "provider-API is kapot / sleutel is ongeldig" van "Gateway-agentpijplijn is kapot"
  - Bevat kleine, geisoleerde regressies (voorbeeld: OpenAI Responses/Codex Responses-reasoningreplay + tool-call-flows)

### Laag 2: Gateway + dev-agent-smoketest (wat "@openclaw" daadwerkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een in-process Gateway starten
  - Een `agent:dev:*`-sessie maken/patchen (modeloverschrijving per run)
  - Modellen-met-sleutels itereren en controleren:
    - "betekenisvolle" respons (geen tools)
    - een echte toolaanroep werkt (leesprobe)
    - optionele extra toolprobes (exec+leesprobe)
    - OpenAI-regressiepaden (alleen tool-call -> vervolg) blijven werken
- Probedetails (zodat je fouten snel kunt uitleggen):
  - `read`-probe: de test schrijft een nonce-bestand in de workspace en vraagt de agent om het te `read`-en en de nonce terug te echoen.
  - `exec+read`-probe: de test vraagt de agent om via `exec` een nonce naar een tijdelijk bestand te schrijven en die daarna terug te `read`-en.
  - afbeeldingsprobe: de test voegt een gegenereerde PNG toe (kat + willekeurige code) en verwacht dat het model `cat <CODE>` teruggeeft.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `test/helpers/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Modellen selecteren:
  - Standaard: moderne toelatingslijst (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` om dezelfde beperkte toelatingslijst voor kleine modellen door de volledige Gateway+agent-pijplijn te laten lopen
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor de moderne toelatingslijst
  - Of stel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (of een kommagescheiden lijst) in om te beperken
  - Modern/all- en small-Gateway-sweeps gebruiken standaard hun samengestelde limieten; stel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` in voor een uitputtende geselecteerde sweep of een positief getal voor een kleinere limiet.
- Providers selecteren (voorkom "alles via OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (toelatingslijst met komma's)
- Tool- en afbeeldingsprobes staan altijd aan in deze live test:
  - `read`-probe + `exec+read`-probe (toolstress)
  - afbeeldingsprobe draait wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (op hoog niveau):
    - Test genereert een kleine PNG met "CAT" + willekeurige code (`test/helpers/live-image-probe.ts`)
    - Verstuurt deze via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parseert bijlagen naar `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Ingebedde agent stuurt een multimodaal gebruikersbericht door naar het model
    - Assertie: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten toegestaan)

<Tip>
Voer dit uit om te zien wat je op je machine kunt testen (en de exacte `provider/model`-id's):

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-backend-smoketest (Claude, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: de Gateway + agent-pijplijn valideren met een lokale CLI-backend, zonder je standaardconfiguratie aan te raken.
- Backend-specifieke smoketest-standaarden staan bij de `cli-backend.ts`-definitie van de eigenaarsextensie.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaarden:
  - Standaardprovider/-model: `claude-cli/claude-sonnet-4-6`
  - Opdracht/args/afbeeldingsgedrag komen uit de metadata van de eigenaar-CLI-backend-Plugin.
- Overschrijvingen (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeeldingsbijlage te verzenden (paden worden in de prompt geinjecteerd). Docker-recepten zetten dit standaard uit tenzij expliciet gevraagd.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-args door te geven in plaats van promptinjectie.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te bepalen hoe afbeeldingsargs worden doorgegeven wanneer `IMAGE_ARG` is ingesteld.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te verzenden en de hervattingsflow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om optioneel deel te nemen aan de Claude Sonnet -> Opus-continuiteitsprobe binnen dezelfde sessie wanneer het geselecteerde model een switchdoel ondersteunt. Docker-recepten zetten dit standaard uit voor aggregatiebetrouwbaarheid.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om optioneel deel te nemen aan de MCP/tool-loopbackprobe. Docker-recepten zetten dit standaard uit tenzij expliciet gevraagd.

Voorbeeld:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Goedkope Gemini MCP-configuratiesmoketest:

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

Docker-recepten voor een enkele provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Opmerkingen:

- De Docker-runner staat op `scripts/test-live-cli-backend-docker.sh`.
- Deze draait de live CLI-backend-smoketest binnen de repo-Docker-image als de niet-rootgebruiker `node`.
- Deze herleidt CLI-smokemetadata uit de eigenaarsextensie en installeert daarna het bijpassende Linux-CLI-pakket (`@anthropic-ai/claude-code` of `@google/gemini-cli`) in een gecachte schrijfbare prefix op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist draagbare Claude Code-abonnement-OAuth via `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` of `CLAUDE_CODE_OAUTH_TOKEN` uit `claude setup-token`. Het bewijst eerst directe `claude -p` in Docker en draait daarna twee Gateway CLI-backend-beurten zonder Anthropic API-key-env-vars te behouden. Deze abonnementslane schakelt de Claude MCP/tool- en afbeeldingsprobes standaard uit omdat deze de gebruikslimieten van het ingelogde abonnement verbruikt en Anthropic het facturerings- en rate-limitgedrag van Claude Agent SDK / `claude -p` kan wijzigen zonder OpenClaw-release.
- De live CLI-backend-smoketest oefent nu dezelfde end-to-end-flow uit voor Claude en Gemini: tekstbeurt, afbeeldingsclassificatiebeurt en daarna een MCP-`cron`-toolaanroep die via de Gateway-CLI wordt geverifieerd.
- Claude's standaard-smoketest patcht de sessie ook van Sonnet naar Opus en verifieert dat de hervatte sessie een eerdere notitie nog steeds onthoudt.

## Live: bereikbaarheid van APNs HTTP/2-proxy

- Test: `src/infra/push-apns-http2.live.test.ts`
- Doel: tunnelen door een lokale HTTP CONNECT-proxy naar Apple's sandbox-APNs-endpoint, de APNs HTTP/2-validatieaanvraag verzenden en controleren dat Apple's echte `403 InvalidProviderToken`-respons via het proxypad terugkomt.
- Inschakelen:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionele timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-bind-smoketest (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: de echte ACP-gesprekskoppelingsflow valideren met een live ACP-agent:
  - stuur `/acp spawn <agent> --bind here`
  - koppel ter plekke een synthetisch berichtkanaalgesprek
  - stuur een normale opvolging in datzelfde gesprek
  - verifieer dat de opvolging terechtkomt in het transcript van de gekoppelde ACP-sessie
- Inschakelen:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standaardinstellingen:
  - ACP-agenten in Docker: `claude,codex,gemini`
  - ACP-agent voor directe `pnpm test:live ...`: `claude`
  - Synthetisch kanaal: Slack-DM-achtige gesprekscontext
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
  - Deze lane gebruikt het gateway-`chat.send`-oppervlak met synthetische oorsprongsroutevelden die alleen voor beheerders zijn, zodat tests berichtkanaalcontext kunnen koppelen zonder te doen alsof er extern wordt afgeleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test het ingebouwde agentregister van de ingebedde `acpx`-Plugin voor de geselecteerde ACP-harnessagent.
  - Het aanmaken van gebonden-sessie-Cron-MCP gebeurt standaard op best-effortbasis, omdat externe ACP-harnassen MCP-aanroepen kunnen annuleren nadat het bewijs voor koppeling/afbeelding is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die Cron-probe na koppeling strikt te maken.

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
- Standaard voert hij de ACP-bind-smoke opeenvolgend uit tegen de geaggregeerde live CLI-agenten: `claude`, `codex` en daarna `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Hij plaatst het bijpassende CLI-authenticatiemateriaal in de container en installeert daarna de gevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` of `opencode-ai`) als die ontbreekt. De ACP-backend zelf is het ingebedde `acpx/runtime`-pakket uit de officiële `acpx`-Plugin.
- De Droid-Docker-variant plaatst `~/.factory` voor instellingen, geeft `FACTORY_API_KEY` door en vereist die API-sleutel omdat lokale Factory-OAuth/keyring-authenticatie niet overdraagbaar is naar de container. Hij gebruikt de ingebouwde ACPX-registervermelding `droid exec --output-format acp`.
- De OpenCode-Docker-variant is een strikte regressielane voor één agent. Hij schrijft een tijdelijk standaardmodel `OPENCODE_CONFIG_CONTENT` uit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`), en `pnpm test:docker:live-acp-bind:opencode` vereist een gekoppeld assistenttranscript in plaats van de generieke skip na koppeling te accepteren.
- Directe `acpx`-CLI-aanroepen zijn alleen een handmatig/workaround-pad om gedrag buiten de Gateway te vergelijken. De Docker ACP-bind-smoke oefent de ingebedde `acpx`-runtimebackend van OpenClaw.

## Live: Codex app-server-harness-smoke

- Doel: de Plugin-eigen Codex-harness valideren via de normale gateway-`agent`-methode:
  - laad de gebundelde `codex`-Plugin
  - selecteer `openai/gpt-5.5`, waarmee OpenAI-agentbeurten standaard via Codex worden gerouteerd
  - stuur een eerste gateway-agentbeurt naar `openai/gpt-5.5` met de Codex-harness geselecteerd
  - stuur een tweede beurt naar dezelfde OpenClaw-sessie en verifieer dat de app-server-thread kan hervatten
  - voer `/codex status` en `/codex models` uit via hetzelfde gateway-commandopad
  - voer optioneel twee door Guardian beoordeelde geëscaleerde shellprobes uit: één onschadelijk commando dat moet worden goedgekeurd en één nepgeheim-upload die moet worden geweigerd zodat de agent terugvraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standaardmodel: `openai/gpt-5.5`
- Optionele afbeeldingsprobe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP/tool-probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoke dwingt provider/model `agentRuntime.id: "codex"` af, zodat een kapotte Codex-harness niet kan slagen door stil terug te vallen op OpenClaw.
- Auth: Codex app-server-authenticatie vanuit de lokale Codex-abonnementslogin. Docker-smokes kunnen ook `OPENAI_API_KEY` leveren voor niet-Codex-probes wanneer van toepassing, plus optioneel gekopieerde `~/.codex/auth.json` en `~/.codex/config.toml`.

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
- Hij geeft `OPENAI_API_KEY` door, kopieert Codex CLI-authbestanden wanneer aanwezig, installeert `@openai/codex` in een schrijfbare aangekoppelde npm-prefix, plaatst de source tree en voert daarna alleen de live Codex-harnesstest uit.
- Docker schakelt de afbeeldings-, MCP/tool- en Guardian-probes standaard in. Stel `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer je een smallere debugrun nodig hebt.
- Docker gebruikt dezelfde expliciete Codex-runtimeconfiguratie, zodat legacy-aliassen of OpenClaw-fallback geen regressie in de Codex-harness kunnen verbergen.

### Aanbevolen live-recepten

Smalle, expliciete allowlists zijn het snelst en het minst flaky:

- Eén model, direct (geen gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Direct profiel voor klein model:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Gateway-profiel voor klein model:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API-smoke:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Eén model, gateway-smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-aanroepen over meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 directe smoke:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google-focus (Gemini API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking-smoke:
  - Gemini 3 dynamische standaard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisch budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Opmerkingen:

- `google/...` gebruikt de Gemini API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity OAuth-bridge (Cloud Code Assist-achtige agenteindpunt).
- `google-gemini-cli/...` gebruikt de lokale Gemini CLI op je machine (aparte auth + tooling-eigenaardigheden).
- Gemini API vs Gemini CLI:
  - API: OpenClaw roept Google's gehoste Gemini API aan via HTTP (API-sleutel / profielauthenticatie); dit is wat de meeste gebruikers bedoelen met "Gemini".
  - CLI: OpenClaw shellt uit naar een lokale `gemini`-binary; die heeft eigen auth en kan zich anders gedragen (streaming/toolondersteuning/versiescheefstand).

## Live: modelmatrix (wat we dekken)

Er is geen vaste "CI-modellijst" (live is opt-in), maar dit zijn de **aanbevolen** modellen om regelmatig te dekken op een ontwikkelmachine met sleutels.

### Moderne smoke-set (tool-aanroepen + afbeelding)

Dit is de run met "gangbare modellen" waarvan we verwachten dat die blijft werken:

- OpenAI (niet-Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` en `google/gemini-3-flash-preview` (vermijd oudere Gemini 2.x-modellen)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` en `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (algemene API) of `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Voer gateway-smoke uit met tools + afbeelding:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool-aanroepen (`Read` + optioneel `Exec`)

Kies minstens één per providerfamilie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (of `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (algemene API) of `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Optionele aanvullende dekking (handig om te hebben):

- xAI: `xai/grok-4.3` (of nieuwste beschikbare)
- Mistral: `mistral/`… (kies één "tools"-geschikt model dat je hebt ingeschakeld)
- Cerebras: `cerebras/`… (als je toegang hebt)
- LM Studio: `lmstudio/`… (lokaal; tool-aanroepen hangen af van de API-modus)

### Vision: afbeelding verzenden (bijlage → multimodaal bericht)

Neem minstens één model dat afbeeldingen ondersteunt op in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI-varianten met vision-ondersteuning, enz.) om de afbeeldingsprobe te oefenen.

### Aggregators / alternatieve gateways

Als je sleutels hebt ingeschakeld, ondersteunen we ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten te vinden die geschikt zijn voor tool+afbeelding)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die je kunt opnemen in de live-matrix (als je credentials/config hebt):

- Ingebouwd: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (aangepaste endpoints): `minimax` (cloud/API), plus elke OpenAI/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM, enz.)

<Tip>
Hardcode "alle modellen" niet in documentatie. De gezaghebbende lijst is wat `discoverModels(...)` op je machine retourneert plus alle beschikbare sleutels.
</Tip>

## Inloggegevens (nooit committen)

Live tests ontdekken inloggegevens op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, zouden live tests dezelfde sleutels moeten vinden.
- Als een live test "no creds" meldt, debug dan op dezelfde manier als je `openclaw models list` / modelselectie zou debuggen.

- Auth-profielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit is wat "profielsleutels" betekent in de live tests)
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Verouderde state-map: `~/.openclaw/credentials/` (wordt gekopieerd naar de gestagede live-home wanneer aanwezig, maar is niet de hoofdopslag voor profielsleutels)
- Live lokale runs kopiëren standaard de actieve configuratie, per-agent `auth-profiles.json`-bestanden, verouderde `credentials/` en ondersteunde externe CLI-auth-mappen naar een tijdelijke test-home; gestagede live-homes slaan `workspace/` en `sandboxes/` over, en padoverschrijvingen voor `agents.*.workspace` / `agentDir` worden verwijderd zodat probes wegblijven van je echte host-workspace.

Als je op env-sleutels wilt vertrouwen, exporteer ze dan vóór lokale tests of gebruik de
Docker-runners hieronder met een expliciet `OPENCLAW_PROFILE_FILE`.

## Deepgram live (audiotranscriptie)

- Test: `extensions/deepgram/audio.live.test.ts`
- Inschakelen: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-codingplan live

- Test: `extensions/byteplus/live.test.ts`
- Inschakelen: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionele modeloverschrijving: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-workflowmedia live

- Test: `extensions/comfy/comfy.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Bereik:
  - Test de gebundelde comfy-paden voor afbeeldingen, video en `music_generate`
  - Slaat elke capability over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen aan comfy-workflowindiening, polling, downloads of Plugin-registratie

## Afbeeldingsgeneratie live

- Test: `test/image-generation.runtime.live.test.ts`
- Opdracht: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Bereik:
  - Somt elke geregistreerde Plugin voor afbeeldingsgeneratieproviders op
  - Gebruikt al geëxporteerde provider-env-vars vóór het proben
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-inloggegevens niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert elke geconfigureerde provider uit via de gedeelde afbeeldingsgeneratie-runtime:
    - `<provider>:generate`
    - `<provider>:edit` wanneer de provider edit-ondersteuning declareert
- Huidige gebundelde providers die worden gedekt:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Optionele beperking:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en overrides die alleen uit env komen te negeren

Voor het verzonden CLI-pad voeg je een `infer`-smoke toe nadat de provider/runtime-live
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

Dit dekt CLI-argumentparsing, configuratie/default-agent-resolutie, gebundelde
Plugin-activering, de gedeelde afbeeldingsgeneratie-runtime en de live provider-
request. Plugin-afhankelijkheden worden verwacht aanwezig te zijn vóór runtime-load.

## Muziekgeneratie live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Bereik:
  - Test het gedeelde gebundelde pad voor muziekgeneratieproviders
  - Dekt momenteel Google en MiniMax
  - Gebruikt al geëxporteerde provider-env-vars vóór het proben
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-inloggegevens niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert beide gedeclareerde runtime-modi uit wanneer beschikbaar:
    - `generate` met alleen prompt-invoer
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - Huidige gedeelde-lane-dekking:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: apart Comfy-livebestand, niet deze gedeelde sweep
- Optionele beperking:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en overrides die alleen uit env komen te negeren

## Videogeneratie live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Bereik:
  - Test het gedeelde gebundelde pad voor videogeneratieproviders
  - Gebruikt standaard het release-veilige smoke-pad: niet-FAL-providers, één tekst-naar-video-request per provider, lobster-prompt van één seconde en een operationcap per provider uit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`)
  - Slaat FAL standaard over omdat wachtrijlatentie aan providerzijde de releasetijd kan domineren; geef `--video-providers fal` of `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` mee om dit expliciet uit te voeren
  - Gebruikt al geëxporteerde provider-env-vars vóór het proben
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-inloggegevens niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transformatiemodi uit te voeren wanneer beschikbaar:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model in de gedeelde sweep buffer-backed lokale afbeeldingsinvoer accepteert
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model in de gedeelde sweep buffer-backed lokale video-invoer accepteert
  - Huidige gedeclareerde maar overgeslagen `imageToVideo`-providers in de gedeelde sweep:
    - `vydra` omdat gebundelde `veo3` alleen tekst ondersteunt en gebundelde `kling` een externe afbeeldings-URL vereist
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - dat bestand voert `veo3` tekst-naar-video uit plus een `kling`-lane die standaard een externe afbeeldings-URL-fixture gebruikt
  - Huidige live-dekking voor `videoToVideo`:
    - `runway` alleen wanneer het geselecteerde model `runway/gen4_aleph` is
  - Huidige gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde sweep:
    - `alibaba`, `qwen`, `xai` omdat die paden momenteel externe `http(s)` / MP4-referentie-URL's vereisen
    - `google` omdat de huidige gedeelde Gemini/Veo-lane lokale buffer-backed invoer gebruikt en dat pad niet wordt geaccepteerd in de gedeelde sweep
    - `openai` omdat de huidige gedeelde lane geen garanties heeft voor org-specifieke toegang tot video-editing
- Optionele beperking:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaard sweep op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de operationcap per provider te verlagen voor een agressieve smoke-run
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en overrides die alleen uit env komen te negeren

## Media-live-harness

- Opdracht: `pnpm test:live:media`
- Doel:
  - Voert de gedeelde image-, music- en video-live-suites uit via één repo-native entrypoint
  - Gebruikt al geëxporteerde provider-env-vars
  - Beperkt standaard elke suite automatisch tot providers die momenteel bruikbare auth hebben
  - Hergebruikt `scripts/test-live.mjs`, zodat Heartbeat- en quiet-mode-gedrag consistent blijven
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) - unit-, integratie-, QA- en Docker-suites
