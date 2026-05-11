---
read_when:
    - Live modelmatrix / CLI-backend / ACP / media-provider-smoketests uitvoeren
    - Fouten opsporen in referentieresolutie voor live-tests
    - Een nieuwe providerspecifieke livetest toevoegen
sidebarTitle: Live tests
summary: 'Live-tests (met netwerktoegang): modelmatrix, CLI-backends, ACP, mediaproviders, inloggegevens'
title: 'Testen: live-testsuites'
x-i18n:
    generated_at: "2026-05-11T20:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

Voor quickstart, QA-runners, unit-/integratiesuites en Docker-flows, zie
[Testing](/nl/help/testing). Deze pagina behandelt de **live** test
suites (met netwerktoegang): modelmatrix, CLI-backends, ACP en live tests voor mediaproviders, plus
credentialafhandeling.

## Live: rookopdrachten voor lokaal profiel

Source `~/.profile` vóór ad-hoc live controles, zodat providersleutels en lokale tool
paden overeenkomen met je shell:

```bash
source ~/.profile
```

Veilige mediarooktest:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Veilige rooktest voor gereedheid van spraakoproepen:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` is een dry-run tenzij `--yes` ook aanwezig is. Gebruik `--yes` alleen
wanneer je bewust een echte notificatieoproep wilt plaatsen. Voor Twilio, Telnyx en
Plivo vereist een succesvolle gereedheidscontrole een openbare Webhook-URL; uitsluitend lokale
loopback-/privéfallbacks worden bewust geweigerd.

## Live: capability-sweep voor Android-node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: roep **elke opdracht aan die momenteel wordt geadverteerd** door een verbonden Android-node en valideer opdrachtcontractgedrag.
- Scope:
  - Vooraf geconditioneerde/handmatige setup (de suite installeert/start/koppelt de app niet).
  - Opdracht-per-opdracht Gateway-`node.invoke`-validatie voor de geselecteerde Android-node.
- Vereiste pre-setup:
  - Android-app al verbonden + gekoppeld aan de Gateway.
  - App op de voorgrond gehouden.
  - Machtigingen/toestemming voor vastleggen verleend voor capabilities waarvan je verwacht dat ze slagen.
- Optionele doeloverschrijvingen:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige Android-setupdetails: [Android-app](/nl/platforms/android)

## Live: modelrooktest (profielsleutels)

Live tests zijn opgesplitst in twee lagen, zodat we fouten kunnen isoleren:

- "Direct model" vertelt ons of de provider/het model überhaupt kan antwoorden met de gegeven sleutel.
- "Gateway-rooktest" vertelt ons of de volledige gateway+agent-pipeline werkt voor dat model (sessies, geschiedenis, tools, sandboxbeleid, enzovoort).

### Laag 1: directe modelvoltooiing (geen Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen opsommen
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor je credentials hebt
  - Een kleine voltooiing per model uitvoeren (en gerichte regressies waar nodig)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Stel `OPENCLAW_LIVE_MODELS=modern` in (of `all`, alias voor modern) om deze suite daadwerkelijk uit te voeren; anders slaat deze over om `pnpm test:live` gericht te houden op Gateway-rooktests
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` om de moderne allowlist uit te voeren (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor de moderne allowlist
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist met komma's)
  - Modern/all-sweeps gebruiken standaard een samengestelde high-signal limiet; stel `OPENCLAW_LIVE_MAX_MODELS=0` in voor een volledige moderne sweep of een positief getal voor een kleinere limiet.
  - Volledige sweeps gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` voor de timeout van de hele direct-model-test. Standaard: 60 minuten.
  - Direct-model-probes draaien standaard met 20-voudige paralleliteit; stel `OPENCLAW_LIVE_MODEL_CONCURRENCY` in om dit te overschrijven.
- Providers selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist met komma's)
- Waar sleutels vandaan komen:
  - Standaard: profielopslag en env-fallbacks
  - Stel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` in om alleen **profielopslag** af te dwingen
- Waarom dit bestaat:
  - Scheidt "provider-API is kapot / sleutel is ongeldig" van "gatewayagent-pipeline is kapot"
  - Bevat kleine, geïsoleerde regressies (voorbeeld: OpenAI Responses/Codex Responses-reasoningreplay + tool-call-flows)

### Laag 2: Gateway + rooktest voor dev-agent (wat "@openclaw" daadwerkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een in-process Gateway starten
  - Een `agent:dev:*`-sessie maken/patchen (modeloverschrijving per run)
  - Door modellen-met-sleutels itereren en controleren:
    - "betekenisvolle" respons (geen tools)
    - een echte toolaanroep werkt (read-probe)
    - optionele extra toolprobes (exec+read-probe)
    - OpenAI-regressiepaden (alleen tool-call → vervolg) blijven werken
- Probedetails (zodat je fouten snel kunt uitleggen):
  - `read`-probe: de test schrijft een nonce-bestand in de workspace en vraagt de agent om het te `read` en de nonce terug te echoën.
  - `exec+read`-probe: de test vraagt de agent om via `exec` een nonce naar een tijdelijk bestand te schrijven en die daarna terug te `read`.
  - afbeeldingsprobe: de test voegt een gegenereerde PNG toe (kat + gerandomiseerde code) en verwacht dat het model `cat <CODE>` retourneert.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `src/gateway/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Modellen selecteren:
  - Standaard: moderne allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor de moderne allowlist
  - Of stel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` in (of een lijst met komma's) om te beperken
  - Modern/all Gateway-sweeps gebruiken standaard een samengestelde high-signal limiet; stel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` in voor een volledige moderne sweep of een positief getal voor een kleinere limiet.
- Providers selecteren (vermijd "alles van OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist met komma's)
- Tool- en afbeeldingsprobes staan altijd aan in deze live test:
  - `read`-probe + `exec+read`-probe (toolstress)
  - afbeeldingsprobe draait wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (globaal):
    - Test genereert een kleine PNG met "CAT" + willekeurige code (`src/gateway/live-image-probe.ts`)
    - Verstuurt die via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parseert bijlagen naar `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Ingebedde agent stuurt een multimodaal gebruikersbericht door naar het model
    - Assertie: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten toegestaan)

<Tip>
Om te zien wat je op je machine kunt testen (en de exacte `provider/model`-ids), voer uit:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-backend-rooktest (Claude, Codex, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: valideer de Gateway + agent-pipeline met een lokale CLI-backend, zonder je standaardconfiguratie aan te raken.
- Backend-specifieke rookteststandaarden staan bij de `cli-backend.ts`-definitie van de eigenaarsextensie.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaarden:
  - Standaardprovider/-model: `claude-cli/claude-sonnet-4-6`
  - Opdracht/args/afbeeldingsgedrag komen uit de metadata van de eigenaar-CLI-backend-Plugin.
- Overschrijvingen (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeeldingsbijlage te versturen (paden worden in de prompt geïnjecteerd). Docker-recepten zetten dit standaard uit, tenzij expliciet gevraagd.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-args door te geven in plaats van promptinjectie.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te bepalen hoe afbeeldingsargs worden doorgegeven wanneer `IMAGE_ARG` is ingesteld.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te sturen en de resumeflow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om je aan te melden voor de Claude Sonnet -> Opus-continuïteitsprobe binnen dezelfde sessie wanneer het geselecteerde model een schakeltarget ondersteunt. Docker-recepten zetten dit standaard uit voor aggregatiebetrouwbaarheid.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om je aan te melden voor de MCP/tool-loopbackprobe. Docker-recepten zetten dit standaard uit, tenzij expliciet gevraagd.

Voorbeeld:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Goedkope Gemini MCP-configrooktest:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dit vraagt Gemini niet om een respons te genereren. Het schrijft dezelfde systeem
instellingen die OpenClaw aan Gemini geeft en voert daarna `gemini --debug mcp list` uit om te bewijzen dat een
opgeslagen `transport: "streamable-http"`-server wordt genormaliseerd naar Gemini's HTTP MCP
vorm en verbinding kan maken met een lokale streamable-HTTP-MCP-server.

Docker-recept:

```bash
pnpm test:docker:live-cli-backend
```

Docker-recepten voor één provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notities:

- De Docker-runner staat op `scripts/test-live-cli-backend-docker.sh`.
- Deze voert de live CLI-backend-rooktest uit binnen de repo-Docker-image als de niet-rootgebruiker `node`.
- Deze haalt CLI-rooktestmetadata op uit de eigenaarsextensie en installeert daarna het bijpassende Linux-CLI-pakket (`@anthropic-ai/claude-code`, `@openai/codex` of `@google/gemini-cli`) in een gecachete schrijfbare prefix op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist portable Claude Code-abonnements-OAuth via óf `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` óf `CLAUDE_CODE_OAUTH_TOKEN` uit `claude setup-token`. Het bewijst eerst directe `claude -p` in Docker en voert daarna twee Gateway CLI-backend-beurten uit zonder Anthropic API-key env vars te behouden. Deze abonnementsbaan schakelt de Claude MCP/tool- en afbeeldingsprobes standaard uit, omdat Claude momenteel gebruik door apps van derden routeert via extra-gebruiksfacturering in plaats van normale abonnementsplanlimieten.
- De live CLI-backend-rooktest oefent nu dezelfde end-to-end-flow voor Claude, Codex en Gemini: tekstbeurt, afbeeldingsclassificatiebeurt en daarna MCP-`cron`-toolaanroep geverifieerd via de Gateway-CLI.
- Claude's standaardrooktest patcht ook de sessie van Sonnet naar Opus en verifieert dat de hervatte sessie nog steeds een eerdere notitie onthoudt.

## Live: bereikbaarheid van APNs HTTP/2-proxy

- Test: `src/infra/push-apns-http2.live.test.ts`
- Doel: tunnel via een lokale HTTP CONNECT-proxy naar Apple's sandbox-APNs-eindpunt, verstuur de APNs HTTP/2-validatieaanvraag en controleer dat Apple's echte `403 InvalidProviderToken`-respons via het proxypad terugkomt.
- Inschakelen:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionele timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-bindrooktest (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: valideer de echte ACP-gespreksbindflow met een live ACP-agent:
  - stuur `/acp spawn <agent> --bind here`
  - bind een synthetisch berichtkanaalgesprek ter plekke
  - stuur een normale follow-up in datzelfde gesprek
  - verifieer dat de follow-up in het transcript van de gebonden ACP-sessie terechtkomt
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
- Notities:
  - Deze lane gebruikt het Gateway `chat.send`-oppervlak met synthetische velden voor de oorspronkelijke route die alleen voor beheerders zijn, zodat tests berichtkanaalcontext kunnen koppelen zonder te doen alsof er extern wordt afgeleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test de ingebouwde agentregistry van de ingesloten `acpx`-plugin voor de geselecteerde ACP-harnessagent.
  - MCP-aanmaak voor bound-session cron is standaard best-effort, omdat externe ACP-harnesses MCP-aanroepen kunnen annuleren nadat het bind-/afbeeldingsbewijs is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die cron-probe na het binden strikt te maken.

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

Docker-notities:

- De Docker-runner bevindt zich op `scripts/test-live-acp-bind-docker.sh`.
- Standaard voert hij de ACP-bindsmoke achtereenvolgens uit tegen de geaggregeerde live CLI-agenten: `claude`, `codex` en daarna `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Hij sourcet `~/.profile`, zet het bijbehorende CLI-authmateriaal klaar in de container en installeert daarna de gevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` of `opencode-ai`) als die ontbreekt. De ACP-backend zelf is het ingesloten `acpx/runtime`-pakket uit de officiële `acpx`-plugin.
- De Droid Docker-variant zet `~/.factory` klaar voor instellingen, forwardt `FACTORY_API_KEY` en vereist die API-sleutel omdat lokale Factory OAuth-/keyring-auth niet overdraagbaar is naar de container. Hij gebruikt ACPX's ingebouwde registry-item `droid exec --output-format acp`.
- De OpenCode Docker-variant is een strikte regressielane voor één agent. Hij schrijft een tijdelijk standaardmodel in `OPENCODE_CONFIG_CONTENT` vanuit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`) na het sourcen van `~/.profile`, en `pnpm test:docker:live-acp-bind:opencode` vereist een gebonden assistenttranscript in plaats van de generieke overslag na het binden te accepteren.
- Directe `acpx` CLI-aanroepen zijn alleen een handmatig/uitwijkpad om gedrag buiten de Gateway te vergelijken. De Docker ACP-bindsmoke test OpenClaw's ingesloten `acpx` runtime-backend.

## Live: Codex app-server-harnesssmoke

- Doel: valideer de plugin-eigen Codex-harness via de normale Gateway
  `agent`-methode:
  - laad de gebundelde `codex`-plugin
  - selecteer `openai/gpt-5.5`, waarmee OpenAI-agentbeurten standaard via Codex worden gerouteerd
  - stuur een eerste Gateway-agentbeurt naar `openai/gpt-5.5` met de Codex-harness geselecteerd
  - stuur een tweede beurt naar dezelfde OpenClaw-sessie en verifieer dat de app-server
    thread kan hervatten
  - voer `/codex status` en `/codex models` uit via hetzelfde Gateway-opdrachtpad
  - voer optioneel twee door Guardian beoordeelde shellprobes met verhoogde rechten uit: één onschuldige
    opdracht die moet worden goedgekeurd en één nepgeheim-upload die moet worden
    geweigerd zodat de agent terugvraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standaardmodel: `openai/gpt-5.5`
- Optionele afbeeldingsprobe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP-/toolprobe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoke forceert provider/model `agentRuntime.id: "codex"` zodat een kapotte Codex-
  harness niet kan slagen door stil terug te vallen op PI.
- Auth: Codex app-server-auth vanuit de lokale Codex-abonnementslogin. Docker-
  smokes kunnen ook `OPENAI_API_KEY` leveren voor niet-Codex-probes waar van toepassing,
  plus optioneel gekopieerde `~/.codex/auth.json` en `~/.codex/config.toml`.

Lokaal recept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-recept:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker-notities:

- De Docker-runner bevindt zich op `scripts/test-live-codex-harness-docker.sh`.
- Hij sourcet de gemounte `~/.profile`, geeft `OPENAI_API_KEY` door, kopieert Codex CLI-
  authbestanden wanneer aanwezig, installeert `@openai/codex` in een schrijfbare gemounte npm-
  prefix, zet de source tree klaar en voert daarna alleen de live test voor de Codex-harness uit.
- Docker schakelt de afbeeldings-, MCP-/tool- en Guardian-probes standaard in. Stel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer je een beperktere debug-
  run nodig hebt.
- Docker gebruikt dezelfde expliciete Codex-runtimeconfiguratie, zodat legacy aliassen of PI-
  fallback een regressie in de Codex-harness niet kunnen verbergen.

### Aanbevolen live recepten

Smalle, expliciete allowlists zijn het snelst en het minst flaky:

- Eén model, direct (geen Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Eén model, Gateway-smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling over meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-focus (Gemini API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking-smoke:
  - Als lokale sleutels in het shellprofiel staan: `source ~/.profile`
  - Gemini 3 dynamische standaardwaarde: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisch budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notities:

- `google/...` gebruikt de Gemini API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity OAuth-bridge (Cloud Code Assist-achtig agenteindpunt).
- `google-gemini-cli/...` gebruikt de lokale Gemini CLI op je machine (aparte auth en tooling-eigenaardigheden).
- Gemini API versus Gemini CLI:
  - API: OpenClaw roept Google's gehoste Gemini API aan via HTTP (API-sleutel / profielauth); dit is wat de meeste gebruikers bedoelen met "Gemini".
  - CLI: OpenClaw shellt uit naar een lokale `gemini`-binary; die heeft eigen auth en kan zich anders gedragen (streaming-/toolondersteuning/versiescheefstand).

## Live: modelmatrix (wat we dekken)

Er is geen vaste "CI-modellijst" (live is opt-in), maar dit zijn de **aanbevolen** modellen om regelmatig te dekken op een devmachine met sleutels.

### Moderne smokeset (tool calling + afbeelding)

Dit is de run met "gangbare modellen" waarvan we verwachten dat die blijft werken:

- OpenAI (niet-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` en `google/gemini-3-flash-preview` (vermijd oudere Gemini 2.x-modellen)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` en `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Voer Gateway-smoke uit met tools + afbeelding:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + optionele Exec)

Kies ten minste één per providerfamilie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (of `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Optionele extra dekking (handig om te hebben):

- xAI: `xai/grok-4.3` (of nieuwste beschikbare)
- Mistral: `mistral/`… (kies één voor "tools" geschikt model dat je hebt ingeschakeld)
- Cerebras: `cerebras/`… (als je toegang hebt)
- LM Studio: `lmstudio/`… (lokaal; tool calling hangt af van de API-modus)

### Vision: afbeelding verzenden (bijlage → multimodaal bericht)

Neem ten minste één afbeeldingsgeschikt model op in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude-/Gemini-/OpenAI-varianten met vision-ondersteuning, enz.) om de afbeeldingsprobe te testen.

### Aggregators / alternatieve gateways

Als je sleutels hebt ingeschakeld, ondersteunen we ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten te vinden die tools en afbeeldingen ondersteunen)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die je in de live matrix kunt opnemen (als je credentials/config hebt):

- Ingebouwd: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (aangepaste eindpunten): `minimax` (cloud/API), plus elke OpenAI-/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM, enz.)

<Tip>
Hardcode geen "alle modellen" in docs. De gezaghebbende lijst is wat `discoverModels(...)` op je machine retourneert plus de beschikbare sleutels.
</Tip>

## Credentials (nooit committen)

Live tests ontdekken credentials op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, zouden live tests dezelfde sleutels moeten vinden.
- Als een live test "no creds" meldt, debug dan op dezelfde manier als je `openclaw models list` / modelselectie zou debuggen.

- Authenticatieprofielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit is wat "profile keys" betekent in de live tests)
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Map voor legacy-status: `~/.openclaw/credentials/` (wordt naar de gefaseerde live-home gekopieerd wanneer aanwezig, maar is niet de hoofdopslag voor profielsleutels)
- Lokale live-runs kopiëren standaard de actieve configuratie, `auth-profiles.json`-bestanden per agent, legacy `credentials/` en ondersteunde externe CLI-authenticatiemappen naar een tijdelijke test-home; gefaseerde live-homes slaan `workspace/` en `sandboxes/` over, en `agents.*.workspace` / `agentDir`-padoverschrijvingen worden verwijderd zodat probes wegblijven van je echte host-workspace.

Als je op omgevingssleutels wilt vertrouwen (bijv. geëxporteerd in je `~/.profile`), voer lokale tests dan uit na `source ~/.profile`, of gebruik de Docker-runners hieronder (die kunnen `~/.profile` in de container mounten).

## Deepgram live (audiotranscriptie)

- Test: `extensions/deepgram/audio.live.test.ts`
- Inschakelen: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-coderingsplan live

- Test: `extensions/byteplus/live.test.ts`
- Inschakelen: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionele modeloverschrijving: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-workflowmedia live

- Test: `extensions/comfy/comfy.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Scope:
  - Oefent de meegeleverde comfy-paden voor afbeeldingen, video en `music_generate`
  - Slaat elke mogelijkheid over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen aan comfy-workflowverzending, polling, downloads of Plugin-registratie

## Afbeeldingsgeneratie live

- Test: `test/image-generation.runtime.live.test.ts`
- Opdracht: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Scope:
  - Somt elke geregistreerde Plugin voor afbeeldingsgeneratieproviders op
  - Laadt ontbrekende provideromgevingsvariabelen uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen authenticatieprofielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-referenties niet maskeren
  - Slaat providers zonder bruikbare authenticatie/profiel/model over
  - Voert elke geconfigureerde provider uit via de gedeelde runtime voor afbeeldingsgeneratie:
    - `<provider>:generate`
    - `<provider>:edit` wanneer de provider bewerkingsondersteuning declareert
- Huidige meegeleverde providers die worden gedekt:
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
- Optioneel authenticatiegedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om authenticatie via de profielopslag af te dwingen en overschrijvingen met alleen omgevingsvariabelen te negeren

Voeg voor het geleverde CLI-pad een `infer`-smoke toe nadat de provider-/runtime-live
test is geslaagd:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dit dekt CLI-argumentparsing, resolutie van configuratie/standaardagent, activering
van meegeleverde Plugins, de gedeelde runtime voor afbeeldingsgeneratie en het
live providerverzoek. Plugin-afhankelijkheden moeten aanwezig zijn voordat de
runtime wordt geladen.

## Muziekgeneratie live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Scope:
  - Oefent het gedeelde meegeleverde pad voor muziekgeneratieproviders
  - Dekt momenteel Google en MiniMax
  - Laadt provideromgevingsvariabelen uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen authenticatieprofielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-referenties niet maskeren
  - Slaat providers zonder bruikbare authenticatie/profiel/model over
  - Voert beide gedeclareerde runtimemodi uit wanneer beschikbaar:
    - `generate` met invoer met alleen een prompt
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - Huidige dekking van gedeelde lanes:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: apart Comfy-livebestand, niet deze gedeelde sweep
- Optionele beperking:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel authenticatiegedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om authenticatie via de profielopslag af te dwingen en overschrijvingen met alleen omgevingsvariabelen te negeren

## Videogeneratie live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Scope:
  - Oefent het gedeelde meegeleverde pad voor videogeneratieproviders
  - Gebruikt standaard het release-veilige smoke-pad: niet-FAL-providers, één tekst-naar-videoverzoek per provider, een kreeftprompt van één seconde en een bewerkingslimiet per provider uit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`)
  - Slaat FAL standaard over omdat wachtrijlatenctie aan providerzijde de releasetijd kan domineren; geef `--video-providers fal` of `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` mee om dit expliciet uit te voeren
  - Laadt provideromgevingsvariabelen uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen authenticatieprofielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-referenties niet maskeren
  - Slaat providers zonder bruikbare authenticatie/profiel/model over
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transformatiemodi uit te voeren wanneer beschikbaar:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokaal afbeeldingsinvoer met bufferondersteuning accepteert in de gedeelde sweep
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokale video-invoer met bufferondersteuning accepteert in de gedeelde sweep
  - Huidige gedeclareerde maar overgeslagen `imageToVideo`-providers in de gedeelde sweep:
    - `vydra` omdat de meegeleverde `veo3` alleen tekst ondersteunt en de meegeleverde `kling` een externe afbeeldings-URL vereist
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - dat bestand voert standaard `veo3` tekst-naar-video uit plus een `kling`-lane die een externe afbeeldings-URL-fixture gebruikt
  - Huidige `videoToVideo`-livedekking:
    - `runway` alleen wanneer het geselecteerde model `runway/gen4_aleph` is
  - Huidige gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde sweep:
    - `alibaba`, `qwen`, `xai` omdat die paden momenteel externe `http(s)`- / MP4-referentie-URL's vereisen
    - `google` omdat de huidige gedeelde Gemini/Veo-lane lokale invoer met bufferondersteuning gebruikt en dat pad niet wordt geaccepteerd in de gedeelde sweep
    - `openai` omdat de huidige gedeelde lane geen organisatiespecifieke toegangsgaranties voor video-inpainting/remix heeft
- Optionele beperking:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaardsweep op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de bewerkingslimiet per provider te verlagen voor een agressieve smoke-run
- Optioneel authenticatiegedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om authenticatie via de profielopslag af te dwingen en overschrijvingen met alleen omgevingsvariabelen te negeren

## Live media-harness

- Opdracht: `pnpm test:live:media`
- Doel:
  - Voert de gedeelde live-suites voor afbeelding, muziek en video uit via één repo-native entrypoint
  - Laadt automatisch ontbrekende provideromgevingsvariabelen uit `~/.profile`
  - Beperkt elke suite standaard automatisch tot providers die momenteel bruikbare authenticatie hebben
  - Hergebruikt `scripts/test-live.mjs`, zodat Heartbeat- en quiet-mode-gedrag consistent blijven
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) - unit-, integratie-, QA- en Docker-suites
