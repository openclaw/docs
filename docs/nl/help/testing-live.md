---
read_when:
    - Live modelmatrix / CLI-backend / ACP / mediaprovider-smoketests uitvoeren
    - Foutopsporing van resolutie van inloggegevens voor livetests
    - Een nieuwe providerspecifieke live-test toevoegen
sidebarTitle: Live tests
summary: 'Live (netwerkgebruikende) tests: modelmatrix, CLI-backends, ACP, mediaproviders, referenties'
title: 'Testen: live-testsuites'
x-i18n:
    generated_at: "2026-04-29T22:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Voor snel starten, QA-runners, unit-/integratiesuites en Docker-flows, zie
[Testing](/nl/help/testing). Deze pagina behandelt de **live** (netwerkgebruikende) test
suites: modelmatrix, CLI-backends, ACP en live tests voor mediaproviders, plus
credentialbeheer.

## Live: lokale profiel-smokecommando's

Source `~/.profile` voor ad-hoc live checks zodat providersleutels en lokale tool
paden overeenkomen met je shell:

```bash
source ~/.profile
```

Veilige media-smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Veilige smoke voor gereedheid van spraakoproepen:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` is een dry run tenzij `--yes` ook aanwezig is. Gebruik `--yes` alleen
wanneer je bewust een echte meldoproep wilt plaatsen. Voor Twilio, Telnyx en
Plivo vereist een geslaagde gereedheidscheck een openbare webhook-URL; alleen-lokale
loopback-/private fallbacks worden bewust geweigerd.

## Live: Android-node-capability-sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: **elk momenteel geadverteerd commando** door een verbonden Android-node aanroepen en commandocontractgedrag controleren.
- Bereik:
  - Vooraf geconditioneerde/handmatige setup (de suite installeert/start/koppelt de app niet).
  - Command-voor-command Gateway-`node.invoke`-validatie voor de geselecteerde Android-node.
- Vereiste voorafgaande setup:
  - Android-app is al verbonden en gekoppeld aan de gateway.
  - App blijft op de voorgrond.
  - Toestemmingen/capturetoestemming verleend voor capabilities waarvan je verwacht dat ze slagen.
- Optionele doel-overschrijvingen:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige Android-setupdetails: [Android-app](/nl/platforms/android)

## Live: model-smoke (profielsleutels)

Live tests zijn opgesplitst in twee lagen zodat we fouten kunnen isoleren:

- “Direct model” vertelt ons of de provider/het model überhaupt kan antwoorden met de gegeven sleutel.
- “Gateway-smoke” vertelt ons of de volledige gateway+agent-pijplijn werkt voor dat model (sessies, geschiedenis, tools, sandboxbeleid, enz.).

### Laag 1: Directe modelvoltooiing (geen gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen opsommen
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor je credentials hebt
  - Een kleine voltooiing per model uitvoeren (en gerichte regressies waar nodig)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest direct aanroept)
- Zet `OPENCLAW_LIVE_MODELS=modern` (of `all`, alias voor modern) om deze suite echt uit te voeren; anders wordt deze overgeslagen om `pnpm test:live` gericht te houden op Gateway-smoke
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` om de moderne allowlist uit te voeren (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor de moderne allowlist
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (comma-allowlist)
  - Modern/all-sweeps gebruiken standaard een samengestelde high-signal-limiet; zet `OPENCLAW_LIVE_MAX_MODELS=0` voor een uitputtende moderne sweep of een positief getal voor een kleinere limiet.
  - Uitputtende sweeps gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` voor de timeout van de volledige direct-model-test. Standaard: 60 minuten.
  - Direct-model-probes draaien standaard met parallelisme van 20; zet `OPENCLAW_LIVE_MODEL_CONCURRENCY` om dit te overschrijven.
- Providers selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma-allowlist)
- Waar sleutels vandaan komen:
  - Standaard: profielopslag en env-fallbacks
  - Zet `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om uitsluitend **profielopslag** af te dwingen
- Waarom dit bestaat:
  - Scheidt “provider-API is stuk / sleutel is ongeldig” van “gateway-agent-pijplijn is stuk”
  - Bevat kleine, geïsoleerde regressies (voorbeeld: OpenAI Responses/Codex Responses reasoning-replay + tool-call-flows)

### Laag 2: Gateway + dev-agent-smoke (wat "@openclaw" daadwerkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een in-process gateway starten
  - Een `agent:dev:*`-sessie maken/patchen (modeloverschrijving per run)
  - Modellen-met-sleutels doorlopen en controleren:
    - “betekenisvol” antwoord (geen tools)
    - een echte toolaanroep werkt (read-probe)
    - optionele extra toolprobes (exec+read-probe)
    - OpenAI-regressiepaden (alleen tool-call → vervolg) blijven werken
- Probedetails (zodat je fouten snel kunt uitleggen):
  - `read`-probe: de test schrijft een nonce-bestand in de workspace en vraagt de agent om het te `read` en de nonce terug te echoën.
  - `exec+read`-probe: de test vraagt de agent om met `exec` een nonce naar een tijdelijk bestand te schrijven en het daarna terug te `read`.
  - image-probe: de test voegt een gegenereerde PNG toe (kat + willekeurige code) en verwacht dat het model `cat <CODE>` teruggeeft.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `src/gateway/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest direct aanroept)
- Modellen selecteren:
  - Standaard: moderne allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor de moderne allowlist
  - Of zet `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (of commalijst) om te beperken
  - Modern/all-Gateway-sweeps gebruiken standaard een samengestelde high-signal-limiet; zet `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` voor een uitputtende moderne sweep of een positief getal voor een kleinere limiet.
- Providers selecteren (vermijd “alles via OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma-allowlist)
- Tool- en image-probes staan altijd aan in deze live test:
  - `read`-probe + `exec+read`-probe (toolstress)
  - image-probe draait wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (op hoog niveau):
    - Test genereert een kleine PNG met “CAT” + willekeurige code (`src/gateway/live-image-probe.ts`)
    - Verstuurt die via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parseert attachments naar `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent stuurt een multimodaal gebruikersbericht door naar het model
    - Assertie: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten toegestaan)

<Tip>
Om te zien wat je op je machine kunt testen (en de exacte `provider/model`-id's), voer uit:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-backend-smoke (Claude, Codex, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: de Gateway + agent-pijplijn valideren met een lokale CLI-backend, zonder je standaardconfiguratie aan te raken.
- Backendspecifieke smoke-standaarden staan bij de `cli-backend.ts`-definitie van de eigenaar-plugin.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest direct aanroept)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaarden:
  - Standaardprovider/-model: `claude-cli/claude-sonnet-4-6`
  - Command/args/image-gedrag komt uit de CLI-backend-pluginmetadata van de eigenaar.
- Overschrijvingen (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeelding-attachment te versturen (paden worden in de prompt geïnjecteerd). Docker-recepten zetten dit standaard uit tenzij expliciet gevraagd.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-args door te geven in plaats van promptinjectie.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te bepalen hoe image-args worden doorgegeven wanneer `IMAGE_ARG` is gezet.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te sturen en de resume-flow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om je aan te melden voor de Claude Sonnet -> Opus-continuiteitsprobe binnen dezelfde sessie wanneer het geselecteerde model een switchdoel ondersteunt. Docker-recepten zetten dit standaard uit voor aggregaatbetrouwbaarheid.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om je aan te melden voor de MCP/tool-loopback-probe. Docker-recepten zetten dit standaard uit tenzij expliciet gevraagd.

Voorbeeld:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Goedkope Gemini MCP-config-smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Dit vraagt Gemini niet om een antwoord te genereren. Het schrijft dezelfde systeem
instellingen die OpenClaw aan Gemini geeft, en voert daarna `gemini --debug mcp list` uit om te bewijzen dat een
opgeslagen `transport: "streamable-http"`-server wordt genormaliseerd naar Gemini's HTTP MCP
vorm en verbinding kan maken met een lokale streamable-HTTP MCP-server.

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
- Hij draait de live CLI-backend-smoke binnen de repo-Docker-image als de niet-rootgebruiker `node`.
- Hij haalt CLI-smoke-metadata op uit de eigenaarsextensie en installeert daarna het bijpassende Linux-CLI-pakket (`@anthropic-ai/claude-code`, `@openai/codex` of `@google/gemini-cli`) in een gecachete schrijfbare prefix op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist overdraagbare Claude Code-subscription-OAuth via ofwel `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` of `CLAUDE_CODE_OAUTH_TOKEN` van `claude setup-token`. Het bewijst eerst directe `claude -p` in Docker en draait daarna twee Gateway-CLI-backend-beurten zonder Anthropic-API-key-env-vars te behouden. Deze subscription-lane schakelt de Claude MCP/tool- en image-probes standaard uit omdat Claude momenteel third-party-appgebruik via extra-use-billing routeert in plaats van normale subscription-planlimieten.
- De live CLI-backend-smoke voert nu dezelfde end-to-end-flow uit voor Claude, Codex en Gemini: tekstbeurt, afbeeldingsclassificatiebeurt en daarna een MCP-`cron`-toolaanroep die via de Gateway-CLI wordt geverifieerd.
- Claude's standaard-smoke patcht ook de sessie van Sonnet naar Opus en verifieert dat de hervatte sessie nog steeds een eerdere notitie onthoudt.

## Live: ACP-bind-smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: valideer de echte ACP-gesprekskoppelingsflow met een live ACP-agent:
  - stuur `/acp spawn <agent> --bind here`
  - koppel een synthetisch berichtkanaalgesprek ter plekke
  - stuur een normale vervolgvraag in datzelfde gesprek
  - verifieer dat de vervolgvraag in het gekoppelde ACP-sessietranscript terechtkomt
- Inschakelen:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standaardwaarden:
  - ACP-agenten in Docker: `claude,codex,gemini`
  - ACP-agent voor directe `pnpm test:live ...`: `claude`
  - Synthetisch kanaal: Slack-DM-achtige gesprekscontext
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
  - Deze baan gebruikt het gateway-`chat.send`-oppervlak met alleen-voor-beheerders synthetische originating-route-velden, zodat tests berichtkanaalcontext kunnen koppelen zonder te doen alsof er extern wordt afgeleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test het ingebedde `acpx` Plugin ingebouwde agentregister voor de geselecteerde ACP-harnasagent.
  - Cron-MCP-creatie voor gekoppelde sessies is standaard best-effort, omdat externe ACP-harnassen MCP-aanroepen kunnen annuleren nadat het koppelings-/afbeeldingsbewijs is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die cron-probe na koppeling strikt te maken.

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
- Standaard voert deze de ACP-bind-smoke achtereenvolgens uit tegen de geaggregeerde live CLI-agenten: `claude`, `codex` en daarna `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Deze laadt `~/.profile`, zet het bijbehorende CLI-authenticatiemateriaal klaar in de container en installeert daarna de gevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` of `opencode-ai`) als die ontbreekt. De ACP-backend zelf is het gebundelde ingebedde `acpx/runtime`-pakket uit de `acpx` Plugin.
- De Droid-Docker-variant zet `~/.factory` klaar voor instellingen, geeft `FACTORY_API_KEY` door en vereist die API-sleutel, omdat lokale Factory OAuth-/keyring-authenticatie niet overdraagbaar is naar de container. Deze gebruikt de ingebouwde ACPX-registervermelding `droid exec --output-format acp`.
- De OpenCode-Docker-variant is een strikte regressiebaan voor één agent. Deze schrijft een tijdelijk standaardmodel voor `OPENCODE_CONFIG_CONTENT` vanuit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`) na het laden van `~/.profile`, en `pnpm test:docker:live-acp-bind:opencode` vereist een gekoppeld assistenttranscript in plaats van de generieke skip na koppeling te accepteren.
- Directe `acpx`-CLI-aanroepen zijn alleen een handmatig/workaround-pad om gedrag buiten de Gateway te vergelijken. De Docker ACP-bind-smoke oefent OpenClaw's ingebedde `acpx`-runtimebackend.

## Live: Codex app-server harnas-smoke

- Doel: valideer het Plugin-eigen Codex-harnas via de normale gateway-
  `agent`-methode:
  - laad de gebundelde `codex` Plugin
  - selecteer `OPENCLAW_AGENT_RUNTIME=codex`
  - stuur een eerste gateway-agentbeurt naar `openai/gpt-5.5` met het Codex-harnas afgedwongen
  - stuur een tweede beurt naar dezelfde OpenClaw-sessie en verifieer dat de app-server-
    thread kan hervatten
  - voer `/codex status` en `/codex models` uit via hetzelfde gateway-opdracht-
    pad
  - voer optioneel twee door Guardian beoordeelde geëscaleerde shell-probes uit: één onschuldige
    opdracht die moet worden goedgekeurd en één nep-geheimupload die moet worden
    geweigerd zodat de agent terugvraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standaardmodel: `openai/gpt-5.5`
- Optionele afbeeldingsprobe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP-/toolprobe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoke stelt `OPENCLAW_AGENT_HARNESS_FALLBACK=none` in, zodat een kapot Codex-
  harnas niet kan slagen door stilzwijgend terug te vallen op PI.
- Auth: Codex app-server-authenticatie vanuit de lokale Codex-abonnementslogin. Docker-
  smokes kunnen ook `OPENAI_API_KEY` leveren voor niet-Codex-probes wanneer van toepassing,
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

- De Docker-runner staat op `scripts/test-live-codex-harness-docker.sh`.
- Deze laadt de gemounte `~/.profile`, geeft `OPENAI_API_KEY` door, kopieert Codex CLI-
  auth-bestanden wanneer aanwezig, installeert `@openai/codex` in een schrijfbare gemounte npm-
  prefix, zet de broncode klaar en voert daarna alleen de live test voor het Codex-harnas uit.
- Docker schakelt de afbeeldings-, MCP-/tool- en Guardian-probes standaard in. Stel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer je een beperktere debug-
  run nodig hebt.
- Docker exporteert ook `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend bij de live
  testconfiguratie, zodat legacy-aliassen of PI-fallback een regressie in het Codex-harnas
  niet kunnen verbergen.

### Aanbevolen live recepten

Smalle, expliciete allowlists zijn het snelst en het minst gevoelig voor flaky gedrag:

- Eén model, direct (geen gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Eén model, gateway-smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-aanroepen over meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-focus (Gemini API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptieve-denken-smoke:
  - Als lokale sleutels in het shellprofiel staan: `source ~/.profile`
  - Gemini 3 dynamische standaard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisch budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Opmerkingen:

- `google/...` gebruikt de Gemini API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity OAuth-bridge (Cloud Code Assist-achtige agentendpoint).
- `google-gemini-cli/...` gebruikt de lokale Gemini CLI op je machine (aparte auth + eigenaardigheden in tooling).
- Gemini API versus Gemini CLI:
  - API: OpenClaw roept Google's gehoste Gemini API aan via HTTP (API-sleutel / profielauthenticatie); dit is wat de meeste gebruikers bedoelen met “Gemini”.
  - CLI: OpenClaw voert een lokale `gemini`-binary uit via de shell; deze heeft eigen auth en kan zich anders gedragen (streaming-/toolondersteuning/versiescheefstand).

## Live: modelmatrix (wat we afdekken)

Er is geen vaste “CI-modellenlijst” (live is opt-in), maar dit zijn de **aanbevolen** modellen om regelmatig af te dekken op een ontwikkelmachine met sleutels.

### Moderne smoke-set (tool-aanroepen + afbeelding)

Dit is de run met “gangbare modellen” waarvan we verwachten dat die blijft werken:

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

### Basislijn: tool-aanroepen (Read + optionele Exec)

Kies er minstens één per providerfamilie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (of `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Optionele extra dekking (mooi om te hebben):

- xAI: `xai/grok-4` (of nieuwste beschikbare)
- Mistral: `mistral/`… (kies één model met “tools”-ondersteuning dat je hebt ingeschakeld)
- Cerebras: `cerebras/`… (als je toegang hebt)
- LM Studio: `lmstudio/`… (lokaal; tool-aanroepen hangen af van de API-modus)

### Visie: afbeelding verzenden (bijlage → multimodaal bericht)

Neem minstens één afbeeldingsgeschikt model op in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI-varianten met vision-ondersteuning, enz.) om de afbeeldingsprobe uit te oefenen.

### Aggregators / alternatieve gateways

Als je sleutels hebt ingeschakeld, ondersteunen we ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten te vinden die tools+afbeelding ondersteunen)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die je in de live matrix kunt opnemen (als je credentials/config hebt):

- Ingebouwd: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (aangepaste endpoints): `minimax` (cloud/API), plus elke OpenAI-/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM, enz.)

<Tip>
Hardcode "all models" niet in docs. De gezaghebbende lijst is wat `discoverModels(...)` op je machine retourneert plus de sleutels die beschikbaar zijn.
</Tip>

## Credentials (nooit committen)

Live tests ontdekken credentials op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, zouden live-tests dezelfde sleutels moeten vinden.
- Als een live-test “geen creds” meldt, debug dit dan op dezelfde manier als waarop je `openclaw models list` / modelselectie zou debuggen.

- Auth-profielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit is wat “profielsleutels” betekent in de live-tests)
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Legacy-state-map: `~/.openclaw/credentials/` (wordt naar de staged live home gekopieerd wanneer aanwezig, maar is niet de hoofdopslag voor profielsleutels)
- Live lokale runs kopiëren standaard de actieve configuratie, `auth-profiles.json`-bestanden per agent, legacy `credentials/` en ondersteunde externe CLI-auth-mappen naar een tijdelijke test-home; staged live homes slaan `workspace/` en `sandboxes/` over, en `agents.*.workspace` / `agentDir`-padoverschrijvingen worden verwijderd zodat probes buiten je echte host-workspace blijven.

Als je op omgevingssleutels wilt vertrouwen (bijv. geëxporteerd in je `~/.profile`), voer lokale tests dan uit na `source ~/.profile`, of gebruik de Docker-runners hieronder (die kunnen `~/.profile` in de container mounten).

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
- Scope:
  - Test de meegeleverde comfy-paden voor afbeeldingen, video en `music_generate`
  - Slaat elke capability over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen aan comfy-workflowindiening, polling, downloads of Plugin-registratie

## Afbeeldingsgeneratie live

- Test: `test/image-generation.runtime.live.test.ts`
- Opdracht: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harnas: `pnpm test:live:media image`
- Scope:
  - Somt elke geregistreerde afbeeldingsgeneratieprovider-Plugin op
  - Laadt ontbrekende omgevingsvariabelen voor providers uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-credentials niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert elke geconfigureerde provider uit via de gedeelde afbeeldingsgeneratie-runtime:
    - `<provider>:generate`
    - `<provider>:edit` wanneer de provider edit-ondersteuning declareert
- Huidige meegeleverde providers die worden gedekt:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en overrides die alleen uit de omgeving komen te negeren

Voeg voor het geleverde CLI-pad een `infer`-smoke toe nadat de provider-/runtime-live-test is geslaagd:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dit dekt CLI-argumentparsing, resolutie van configuratie/default-agent, activatie van meegeleverde
Plugin, on-demand herstel van meegeleverde runtime-afhankelijkheden, de gedeelde
afbeeldingsgeneratie-runtime en de live provideraanvraag.

## Muziekgeneratie live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnas: `pnpm test:live:media music`
- Scope:
  - Test het gedeelde pad voor meegeleverde muziekgeneratieproviders
  - Dekt momenteel Google en MiniMax
  - Laadt omgevingsvariabelen voor providers uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-credentials niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert beide gedeclareerde runtime-modi uit wanneer beschikbaar:
    - `generate` met alleen prompt-invoer
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - Huidige dekking van gedeelde lanes:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: afzonderlijk Comfy-live-bestand, niet deze gedeelde sweep
- Optionele vernauwing:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en overrides die alleen uit de omgeving komen te negeren

## Videogeneratie live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnas: `pnpm test:live:media video`
- Scope:
  - Test het gedeelde pad voor meegeleverde videogeneratieproviders
  - Gebruikt standaard het release-veilige smoke-pad: niet-FAL-providers, één tekst-naar-video-aanvraag per provider, lobster-prompt van één seconde en een bewerkingslimiet per provider uit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` standaard)
  - Slaat FAL standaard over omdat wachtrijlatentie aan providerzijde de releasetijd kan domineren; geef `--video-providers fal` of `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` door om dit expliciet uit te voeren
  - Laadt omgevingsvariabelen voor providers uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shell-credentials niet maskeren
  - Slaat providers zonder bruikbare auth/profiel/model over
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transformmodi uit te voeren wanneer beschikbaar:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider/model lokaal afbeeldingsinvoer met bufferbacking accepteert in de gedeelde sweep
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider/model lokale videoinvoer met bufferbacking accepteert in de gedeelde sweep
  - Huidige gedeclareerde maar overgeslagen `imageToVideo`-providers in de gedeelde sweep:
    - `vydra` omdat meegeleverde `veo3` alleen tekst ondersteunt en meegeleverde `kling` een externe afbeeldings-URL vereist
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - dat bestand voert `veo3` tekst-naar-video uit plus een `kling`-lane die standaard een fixture met externe afbeeldings-URL gebruikt
  - Huidige `videoToVideo` live-dekking:
    - alleen `runway` wanneer het geselecteerde model `runway/gen4_aleph` is
  - Huidige gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde sweep:
    - `alibaba`, `qwen`, `xai` omdat die paden momenteel externe `http(s)` / MP4-referentie-URL’s vereisen
    - `google` omdat de huidige gedeelde Gemini/Veo-lane lokale invoer met bufferbacking gebruikt en dat pad niet wordt geaccepteerd in de gedeelde sweep
    - `openai` omdat de huidige gedeelde lane geen garanties heeft voor org-specifieke toegang tot video inpaint/remix
- Optionele vernauwing:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaardsweep op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de bewerkingslimiet per provider te verlagen voor een agressieve smoke-run
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth via de profielopslag af te dwingen en overrides die alleen uit de omgeving komen te negeren

## Media-live-harnas

- Opdracht: `pnpm test:live:media`
- Doel:
  - Voert de gedeelde live-suites voor afbeeldingen, muziek en video uit via één repo-native entrypoint
  - Laadt ontbrekende omgevingsvariabelen voor providers automatisch uit `~/.profile`
  - Vernauwt elke suite standaard automatisch tot providers die momenteel bruikbare auth hebben
  - Hergebruikt `scripts/test-live.mjs`, zodat Heartbeat- en quiet-mode-gedrag consistent blijven
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) — unit-, integratie-, QA- en Docker-suites
