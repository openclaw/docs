---
read_when:
    - Live modelmatrix / CLI-backend / ACP / media-provider-smoketests uitvoeren
    - Foutopsporing voor referentieresolutie bij livetests
    - Een nieuwe providerspecifieke livetest toevoegen
sidebarTitle: Live tests
summary: 'Live (netwerkgebruikende) tests: modelmatrix, CLI-backends, ACP, mediaproviders, referenties'
title: 'Testen: live-testsuites'
x-i18n:
    generated_at: "2026-05-04T11:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

Voor snelle start, QA-runners, unit-/integratietestreeksen en Docker-flows, zie
[Testing](/nl/help/testing). Deze pagina behandelt de **live** (netwerkgebruikende)
testreeksen: modelmatrix, CLI-backends, ACP en live tests voor media-aanbieders,
plus afhandeling van inloggegevens.

## Live: smoketestcommando's voor lokaal profiel

Source `~/.profile` voor ad-hoc live checks zodat aanbiederssleutels en lokale
toolpaden overeenkomen met je shell:

```bash
source ~/.profile
```

Veilige mediasmoketest:

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

`voicecall smoke` is een dry run tenzij `--yes` ook aanwezig is. Gebruik `--yes`
alleen wanneer je bewust een echte meldingsoproep wilt plaatsen. Voor Twilio,
Telnyx en Plivo vereist een succesvolle gereedheidscheck een openbare Webhook-URL;
terugvalopties met alleen local loopback of priveadressen worden bewust geweigerd.

## Live: mogelijkheden-sweep voor Android-Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: **elk commando dat momenteel wordt geadverteerd** door een verbonden Android-Node aanroepen en gedrag volgens het commandocontract controleren.
- Scope:
  - Vooraf geconditioneerde/handmatige setup (de testreeks installeert/start/koppelt de app niet).
  - Commandovoor-command Gateway-`node.invoke`-validatie voor de geselecteerde Android-Node.
- Vereiste voorafgaande setup:
  - Android-app is al verbonden en gekoppeld aan de Gateway.
  - App blijft op de voorgrond.
  - Machtigingen/toestemming voor capture zijn verleend voor de mogelijkheden die je verwacht te laten slagen.
- Optionele doeloverschrijvingen:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige Android-setupdetails: [Android-app](/nl/platforms/android)

## Live: modelsmoketest (profielsleutels)

Live tests zijn verdeeld in twee lagen zodat we fouten kunnen isoleren:

- "Direct model" vertelt ons of de aanbieder/het model uberhaupt kan antwoorden met de gegeven sleutel.
- "Gateway smoke" vertelt ons of de volledige Gateway+agent-pijplijn werkt voor dat model (sessies, geschiedenis, tools, sandboxbeleid, enz.).

### Laag 1: directe modelcompletion (geen Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen opsommen
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor je inloggegevens hebt
  - Een kleine completion per model uitvoeren (en gerichte regressies waar nodig)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` bij direct aanroepen van Vitest)
- Stel `OPENCLAW_LIVE_MODELS=modern` in (of `all`, alias voor modern) om deze testreeks echt uit te voeren; anders slaat hij over om `pnpm test:live` gericht te houden op de Gateway-smoketest
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` om de moderne allowlist uit te voeren (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor de moderne allowlist
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist met komma's)
  - Moderne/all-sweeps gebruiken standaard een samengestelde high-signal cap; stel `OPENCLAW_LIVE_MAX_MODELS=0` in voor een uitputtende moderne sweep of een positief getal voor een kleinere cap.
  - Uitputtende sweeps gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` voor de timeout van de hele direct-model-test. Standaard: 60 minuten.
  - Direct-model-probes draaien standaard met 20-voudige parallelliteit; stel `OPENCLAW_LIVE_MODEL_CONCURRENCY` in om dit te overschrijven.
- Aanbieders selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist met komma's)
- Waar sleutels vandaan komen:
  - Standaard: profielopslag en env-terugvalopties
  - Stel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` in om alleen **profielopslag** af te dwingen
- Waarom dit bestaat:
  - Scheidt "aanbieder-API is kapot / sleutel is ongeldig" van "Gateway-agent-pijplijn is kapot"
  - Bevat kleine, geisoleerde regressies (voorbeeld: reasoning replay van OpenAI Responses/Codex Responses + tool-call-flows)

### Laag 2: Gateway + dev-agent-smoketest (wat "@openclaw" werkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een in-process Gateway opstarten
  - Een `agent:dev:*`-sessie maken/patchen (modeloverschrijving per run)
  - Modellen-met-sleutels doorlopen en controleren:
    - "betekenisvolle" respons (geen tools)
    - een echte toolaanroep werkt (read-probe)
    - optionele extra toolprobes (exec+read-probe)
    - OpenAI-regressiepaden (alleen tool-call -> follow-up) blijven werken
- Probedetails (zodat je fouten snel kunt uitleggen):
  - `read`-probe: de test schrijft een nonce-bestand in de workspace en vraagt de agent het te `read`en en de nonce terug te echoen.
  - `exec+read`-probe: de test vraagt de agent via `exec` een nonce in een tijdelijk bestand te schrijven en het daarna terug te `read`en.
  - afbeeldingsprobe: de test voegt een gegenereerde PNG toe (kat + willekeurige code) en verwacht dat het model `cat <CODE>` retourneert.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `src/gateway/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` bij direct aanroepen van Vitest)
- Modellen selecteren:
  - Standaard: moderne allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor de moderne allowlist
  - Of stel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` in (of een kommagescheiden lijst) om te beperken
  - Moderne/all-Gateway-sweeps gebruiken standaard een samengestelde high-signal cap; stel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` in voor een uitputtende moderne sweep of een positief getal voor een kleinere cap.
- Aanbieders selecteren (vermijd "alles via OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist met komma's)
- Tool- en afbeeldingsprobes staan altijd aan in deze live test:
  - `read`-probe + `exec+read`-probe (toolstress)
  - afbeeldingsprobe draait wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (op hoog niveau):
    - Test genereert een kleine PNG met "CAT" + willekeurige code (`src/gateway/live-image-probe.ts`)
    - Stuurt deze via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parseert attachments naar `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Ingebedde agent stuurt een multimodaal gebruikersbericht door naar het model
    - Assertie: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten toegestaan)

<Tip>
Om te zien wat je op je machine kunt testen (en de exacte `provider/model`-id's), voer uit:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoketest voor CLI-backend (Claude, Codex, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: de Gateway + agent-pijplijn valideren met een lokale CLI-backend, zonder je standaardconfiguratie aan te raken.
- Backendspecifieke smoketeststandaarden staan in de `cli-backend.ts`-definitie van de eigenaarsextensie.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` bij direct aanroepen van Vitest)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaarden:
  - Standaard aanbieder/model: `claude-cli/claude-sonnet-4-6`
  - Commando-/args-/afbeeldingsgedrag komt uit de CLI-backend-Pluginmetadata van de eigenaar.
- Overschrijvingen (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeeldingsbijlage te sturen (paden worden in de prompt geinjecteerd). Dockerrecepten zetten dit standaard uit tenzij expliciet gevraagd.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-argumenten door te geven in plaats van promptinjectie.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te regelen hoe afbeeldingsargumenten worden doorgegeven wanneer `IMAGE_ARG` is ingesteld.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te sturen en de resume-flow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om je aan te melden voor de Claude Sonnet -> Opus-continuiteitsprobe binnen dezelfde sessie wanneer het geselecteerde model een wisseldoel ondersteunt. Dockerrecepten zetten dit standaard uit voor aggregaatbetrouwbaarheid.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om je aan te melden voor de MCP/tool-loopbackprobe. Dockerrecepten zetten dit standaard uit tenzij expliciet gevraagd.

Voorbeeld:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Goedkope Gemini MCP-configuratiesmoketest:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dit vraagt Gemini niet om een antwoord te genereren. Het schrijft dezelfde
systeeminstellingen die OpenClaw aan Gemini geeft en voert daarna `gemini --debug mcp list` uit om te bewijzen dat een opgeslagen `transport: "streamable-http"`-server wordt genormaliseerd naar Gemini's HTTP MCP-vorm en verbinding kan maken met een lokale streamable-HTTP MCP-server.

Dockerrecept:

```bash
pnpm test:docker:live-cli-backend
```

Dockerrecepten voor een enkele aanbieder:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notities:

- De Docker-runner staat op `scripts/test-live-cli-backend-docker.sh`.
- Hij voert de live CLI-backend-smoketest uit binnen de repo-Dockerimage als de niet-rootgebruiker `node`.
- Hij lost CLI-smokemetadata op vanuit de eigenaarsextensie en installeert daarna het bijpassende Linux-CLI-pakket (`@anthropic-ai/claude-code`, `@openai/codex` of `@google/gemini-cli`) in een gecachete schrijfbare prefix op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist draagbare Claude Code-abonnement-OAuth via `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` of `CLAUDE_CODE_OAUTH_TOKEN` uit `claude setup-token`. Hij bewijst eerst directe `claude -p` in Docker en draait daarna twee Gateway-CLI-backend-beurten zonder Anthropic API-key-env-vars te behouden. Deze abonnementslane schakelt de Claude MCP/tool- en afbeeldingsprobes standaard uit omdat Claude momenteel gebruik door apps van derden via extra-gebruiksfacturering routeert in plaats van via normale abonnementslimieten.
- De live CLI-backend-smoketest oefent nu dezelfde end-to-end-flow uit voor Claude, Codex en Gemini: tekstbeurt, afbeeldingsclassificatiebeurt en daarna MCP-`cron`-toolaanroep geverifieerd via de Gateway-CLI.
- Claude's standaard-smoketest patcht ook de sessie van Sonnet naar Opus en verifieert dat de hervatte sessie nog steeds een eerdere notitie onthoudt.

## Live: bereikbaarheid van APNs HTTP/2-proxy

- Test: `src/infra/push-apns-http2.live.test.ts`
- Doel: tunnelen via een lokale HTTP CONNECT-proxy naar Apple's sandbox-APNs-endpoint, het APNs HTTP/2-validatieverzoek sturen en controleren dat Apple's echte `403 InvalidProviderToken`-antwoord via het proxypad terugkomt.
- Inschakelen:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionele timeout:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-bind-smoketest (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: valideer de echte ACP-gespreksbindstroom met een live ACP-agent:
  - stuur `/acp spawn <agent> --bind here`
  - bind een synthetisch gesprek in berichtkanaal op zijn plaats
  - stuur een normale vervolgreactie in datzelfde gesprek
  - verifieer dat de vervolgreactie in het transcript van de gebonden ACP-sessie terechtkomt
- Inschakelen:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standaarden:
  - ACP-agenten in Docker: `claude,codex,gemini`
  - ACP-agent voor directe `pnpm test:live ...`: `claude`
  - Synthetisch kanaal: gesprekscontext in Slack-DM-stijl
  - ACP-backend: `acpx`
- Overschrijvingen:
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
  - Deze lane gebruikt het `chat.send`-oppervlak van de gateway met synthetische originating-route-velden die alleen voor beheerders zijn, zodat tests berichtkanaalcontext kunnen koppelen zonder te doen alsof er extern wordt geleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test het ingebedde ingebouwde agentregister van de `acpx`-Plugin voor de geselecteerde ACP-harnessagent.
  - Cron-MCP-aanmaak voor gebonden sessies is standaard best-effort, omdat externe ACP-harnassen MCP-aanroepen kunnen annuleren nadat het bind-/afbeeldingsbewijs is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die cron-probe na het binden strikt te maken.

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

- De Docker-runner bevindt zich op `scripts/test-live-acp-bind-docker.sh`.
- Standaard voert deze de ACP-bind-smoke sequentieel uit tegen de geaggregeerde live CLI-agenten: `claude`, `codex`, daarna `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Deze sourcet `~/.profile`, staged het bijpassende CLI-authmateriaal in de container en installeert vervolgens de gevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` of `opencode-ai`) als die ontbreekt. De ACP-backend zelf is het ingebedde `acpx/runtime`-pakket van de officiële `acpx`-Plugin.
- De Droid-Docker-variant staged `~/.factory` voor instellingen, stuurt `FACTORY_API_KEY` door en vereist die API-sleutel omdat lokale Factory-OAuth-/keyring-auth niet overdraagbaar is naar de container. Deze gebruikt de ingebouwde `droid exec --output-format acp`-registervermelding van ACPX.
- De OpenCode-Docker-variant is een strikte regressielane voor één agent. Deze schrijft een tijdelijk standaardmodel voor `OPENCODE_CONFIG_CONTENT` vanuit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`) na het sourcen van `~/.profile`, en `pnpm test:docker:live-acp-bind:opencode` vereist een gebonden assistenttranscript in plaats van de generieke skip na het binden te accepteren.
- Directe `acpx`-CLI-aanroepen zijn alleen een handmatig/workaround-pad om gedrag buiten de Gateway te vergelijken. De Docker ACP-bind-smoke test de ingebedde `acpx`-runtimebackend van OpenClaw.

## Live: Codex app-server-harness-smoke

- Doel: valideer de door de Plugin beheerde Codex-harness via de normale gateway
  `agent`-methode:
  - laad de gebundelde `codex`-Plugin
  - selecteer `OPENCLAW_AGENT_RUNTIME=codex`
  - stuur een eerste gateway-agentbeurt naar `openai/gpt-5.5` met de Codex-harness afgedwongen
  - stuur een tweede beurt naar dezelfde OpenClaw-sessie en verifieer dat de app-server
    thread kan hervatten
  - voer `/codex status` en `/codex models` uit via hetzelfde gateway-commandopad
  - voer optioneel twee door Guardian beoordeelde geëscaleerde shellprobes uit: één onschuldige
    opdracht die moet worden goedgekeurd en één nep-secret-upload die moet worden
    geweigerd zodat de agent terugvraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standaardmodel: `openai/gpt-5.5`
- Optionele afbeeldingsprobe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP-/toolprobe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoke gebruikt `agentRuntime.id: "codex"` zodat een kapotte Codex-harness niet
  kan slagen door stilzwijgend terug te vallen op PI.
- Auth: Codex app-server-auth vanuit de lokale Codex-abonnementslogin. Docker-smokes
  kunnen ook `OPENAI_API_KEY` leveren voor niet-Codex-probes waar van toepassing,
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

Docker-opmerkingen:

- De Docker-runner bevindt zich op `scripts/test-live-codex-harness-docker.sh`.
- Deze sourcet de gemounte `~/.profile`, geeft `OPENAI_API_KEY` door, kopieert Codex CLI-
  authbestanden wanneer aanwezig, installeert `@openai/codex` in een schrijfbare gemounte npm-
  prefix, staged de bronstructuur en voert daarna alleen de live test voor de Codex-harness uit.
- Docker schakelt de afbeeldings-, MCP-/tool- en Guardian-probes standaard in. Stel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer je een smallere debug-
  run nodig hebt.
- Docker gebruikt dezelfde expliciete Codex-runtimeconfiguratie, zodat legacy aliassen of PI-
  fallback een regressie in de Codex-harness niet kunnen verbergen.

### Aanbevolen live recepten

Smalle, expliciete allowlists zijn het snelst en het minst flaky:

- Eén model, direct (geen gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Eén model, gateway-smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Toolaanroepen over meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-focus (Gemini-API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive-thinking-smoke:
  - Als lokale sleutels in het shellprofiel staan: `source ~/.profile`
  - Gemini 3 dynamische standaard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisch budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Opmerkingen:

- `google/...` gebruikt de Gemini API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity OAuth-bridge (Cloud Code Assist-achtige agentendpoint).
- `google-gemini-cli/...` gebruikt de lokale Gemini CLI op je machine (afzonderlijke auth + tooling-eigenaardigheden).
- Gemini API versus Gemini CLI:
  - API: OpenClaw roept de gehoste Gemini API van Google aan via HTTP (API-sleutel / profielauth); dit is wat de meeste gebruikers bedoelen met “Gemini”.
  - CLI: OpenClaw shellt uit naar een lokale `gemini`-binary; deze heeft eigen auth en kan zich anders gedragen (streaming-/toolondersteuning/versiescheefloop).

## Live: modelmatrix (wat we afdekken)

Er is geen vaste “CI-modellijst” (live is opt-in), maar dit zijn de **aanbevolen** modellen om regelmatig af te dekken op een ontwikkelmachine met sleutels.

### Moderne smoke-set (toolaanroepen + afbeelding)

Dit is de “algemene modellen”-run waarvan we verwachten dat die blijft werken:

- OpenAI (niet-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` en `google/gemini-3-flash-preview` (vermijd oudere Gemini 2.x-modellen)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` en `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Voer gateway-smoke uit met tools + afbeelding:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Basislijn: toolaanroepen (Read + optionele Exec)

Kies ten minste één per providerfamilie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (of `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Optionele extra dekking (prettig om te hebben):

- xAI: `xai/grok-4.3` (of nieuwste beschikbare)
- Mistral: `mistral/`… (kies één model met “tools”-capaciteit dat je hebt ingeschakeld)
- Cerebras: `cerebras/`… (als je toegang hebt)
- LM Studio: `lmstudio/`… (lokaal; toolaanroepen hangen af van de API-modus)

### Vision: afbeelding verzenden (bijlage → multimodaal bericht)

Neem ten minste één model met afbeeldingscapaciteit op in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude-/Gemini-/OpenAI-varianten met vision-ondersteuning, enz.) om de afbeeldingsprobe te testen.

### Aggregators / alternatieve gateways

Als je sleutels hebt ingeschakeld, ondersteunen we ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten met tool- en afbeeldingscapaciteit te vinden)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die je in de live matrix kunt opnemen (als je credentials/config hebt):

- Ingebouwd: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (aangepaste endpoints): `minimax` (cloud/API), plus elke OpenAI-/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM, enz.)

<Tip>
Hardcode geen "alle modellen" in docs. De gezaghebbende lijst is wat `discoverModels(...)` op jouw machine retourneert plus welke sleutels beschikbaar zijn.
</Tip>

## Credentials (nooit committen)

Live tests ontdekken credentials op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, zouden livetests dezelfde sleutels moeten vinden.
- Als een livetest “geen referenties” meldt, debug dit op dezelfde manier als je `openclaw models list` / modelselectie zou debuggen.

- Auth-profielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit is wat “profielsleutels” betekent in de livetests)
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Legacy-statusmap: `~/.openclaw/credentials/` (gekopieerd naar de gefaseerde live-home wanneer aanwezig, maar niet de hoofdopslag voor profielsleutels)
- Lokale live-runs kopiëren standaard de actieve configuratie, `auth-profiles.json`-bestanden per agent, legacy `credentials/` en ondersteunde externe CLI-authmappen naar een tijdelijke test-home; gefaseerde live-homes slaan `workspace/` en `sandboxes/` over, en pad-overschrijvingen voor `agents.*.workspace` / `agentDir` worden verwijderd zodat probes buiten je echte host-workspace blijven.

Als je op env-sleutels wilt vertrouwen (bijv. geëxporteerd in je `~/.profile`), voer lokale tests dan uit na `source ~/.profile`, of gebruik de Docker-runners hieronder (die `~/.profile` in de container kunnen mounten).

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
- Bereik:
  - Test de gebundelde comfy-paden voor afbeeldingen, video en `music_generate`
  - Slaat elke mogelijkheid over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen aan comfy-workflowinzendingen, polling, downloads of Plugin-registratie

## Afbeeldingsgeneratie live

- Test: `test/image-generation.runtime.live.test.ts`
- Opdracht: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Bereik:
  - Somt elke geregistreerde providerplugin voor afbeeldingsgeneratie op
  - Laadt ontbrekende provider-env-vars uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-referenties niet maskeren
  - Slaat providers over zonder bruikbare auth/profiel/model
  - Voert elke geconfigureerde provider uit via de gedeelde runtime voor afbeeldingsgeneratie:
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
- Optionele vernauwing:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en alleen-env-overschrijvingen te negeren

Voeg voor het meegeleverde CLI-pad een `infer`-smoke toe nadat de provider/runtime-livetest slaagt:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dit dekt CLI-argumentparsing, resolutie van configuratie/standaardagent, activatie van gebundelde plugins, de gedeelde runtime voor afbeeldingsgeneratie en het live providerverzoek. Plugin-afhankelijkheden worden verwacht aanwezig te zijn vóór het laden van de runtime.

## Muziekgeneratie live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Bereik:
  - Test het gedeelde gebundelde providerpad voor muziekgeneratie
  - Dekt momenteel Google en MiniMax
  - Laadt provider-env-vars uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-referenties niet maskeren
  - Slaat providers over zonder bruikbare auth/profiel/model
  - Voert beide gedeclareerde runtime-modi uit wanneer beschikbaar:
    - `generate` met alleen promptinvoer
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - Huidige dekking van de gedeelde lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: apart Comfy-livebestand, niet deze gedeelde sweep
- Optionele vernauwing:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en alleen-env-overschrijvingen te negeren

## Videogeneratie live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Bereik:
  - Test het gedeelde gebundelde providerpad voor videogeneratie
  - Gebruikt standaard het release-veilige smokepad: niet-FAL-providers, één tekst-naar-videoverzoek per provider, kreeftprompt van één seconde en een operatielimiet per provider vanuit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`)
  - Slaat FAL standaard over omdat wachtrijlatentie aan providerzijde de releasetijd kan domineren; geef `--video-providers fal` of `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` door om dit expliciet uit te voeren
  - Laadt provider-env-vars uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live/env-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-referenties niet maskeren
  - Slaat providers over zonder bruikbare auth/profiel/model
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transformatiemodi uit te voeren wanneer beschikbaar:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokaal afbeeldingsinvoer op basis van buffers accepteert in de gedeelde sweep
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokale video-invoer op basis van buffers accepteert in de gedeelde sweep
  - Huidige gedeclareerde maar overgeslagen `imageToVideo`-providers in de gedeelde sweep:
    - `vydra` omdat gebundelde `veo3` alleen tekst ondersteunt en gebundelde `kling` een externe afbeeldings-URL vereist
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - dat bestand voert `veo3` tekst-naar-video uit plus een `kling`-lane die standaard een externe afbeeldings-URL-fixture gebruikt
  - Huidige live-dekking voor `videoToVideo`:
    - `runway` alleen wanneer het geselecteerde model `runway/gen4_aleph` is
  - Huidige gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde sweep:
    - `alibaba`, `qwen`, `xai` omdat die paden momenteel externe `http(s)` / MP4-referentie-URL’s vereisen
    - `google` omdat de huidige gedeelde Gemini/Veo-lane lokale invoer op basis van buffers gebruikt en dat pad niet wordt geaccepteerd in de gedeelde sweep
    - `openai` omdat de huidige gedeelde lane geen garanties heeft voor org-specifieke toegang tot video-inpainting/remixing
- Optionele vernauwing:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaardsweep op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de operatielimiet per provider te verlagen voor een agressieve smokerun
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en alleen-env-overschrijvingen te negeren

## Media-liveharness

- Opdracht: `pnpm test:live:media`
- Doel:
  - Voert de gedeelde live-suites voor afbeeldingen, muziek en video uit via één repo-native entrypoint
  - Laadt ontbrekende provider-env-vars automatisch uit `~/.profile`
  - Vernauwt elke suite standaard automatisch tot providers die momenteel bruikbare auth hebben
  - Hergebruikt `scripts/test-live.mjs`, zodat Heartbeat- en stille-modusgedrag consistent blijven
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) — unit-, integratie-, QA- en Docker-suites
