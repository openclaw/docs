---
read_when:
    - Live-modelmatrix / CLI-backend / ACP / mediaprovider-smoketests uitvoeren
    - Foutopsporing van de resolutie van aanmeldgegevens voor live-tests
    - Een nieuwe providerspecifieke livetest toevoegen
sidebarTitle: Live tests
summary: 'Live-tests (met netwerktoegang): modelmatrix, CLI-backends, ACP, mediaproviders, referenties'
title: 'Testen: testreeksen in de live-omgeving'
x-i18n:
    generated_at: "2026-05-02T11:19:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

Voor snelle start, QA-runners, unit-/integratiesuites en Docker-flows, zie
[Testing](/nl/help/testing). Deze pagina behandelt de **live** (netwerkgebruikende) test
suites: modelmatrix, CLI-backends, ACP en live tests voor mediaproviders, plus
credentialbeheer.

## Live: lokale profiel-smokecommando's

Source `~/.profile` voordat je ad-hoc live checks uitvoert, zodat provider-sleutels en lokale tool
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
wanneer je bewust een echte meldingsoproep wilt plaatsen. Voor Twilio, Telnyx en
Plivo vereist een geslaagde gereedheidscontrole een openbare Webhook-URL; local loopback-only
of privé-fallbacks worden bewust geweigerd.

## Live: Android Node-capaciteitssweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: **elk commando dat momenteel wordt geadverteerd** door een verbonden Android Node aanroepen en het commandocontractgedrag controleren.
- Bereik:
  - Vooraf geconditioneerde/handmatige setup (de suite installeert/start/koppelt de app niet).
  - Gateway `node.invoke`-validatie per commando voor de geselecteerde Android Node.
- Vereiste pre-setup:
  - Android-app al verbonden en gekoppeld aan de Gateway.
  - App op de voorgrond gehouden.
  - Machtigingen/toestemming voor opname verleend voor capaciteiten waarvan je verwacht dat ze slagen.
- Optionele doel-overrides:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige details voor Android-setup: [Android-app](/nl/platforms/android)

## Live: model-smoke (profielsleutels)

Live tests zijn gesplitst in twee lagen zodat we fouten kunnen isoleren:

- “Direct model” vertelt ons of de provider/het model überhaupt kan antwoorden met de opgegeven sleutel.
- “Gateway-smoke” vertelt ons of de volledige gateway+agent-pijplijn werkt voor dat model (sessies, geschiedenis, tools, sandboxbeleid enz.).

### Laag 1: directe modelaanvulling (geen Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen opsommen
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor je credentials hebt
  - Een kleine aanvulling per model uitvoeren (en gerichte regressies waar nodig)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Stel `OPENCLAW_LIVE_MODELS=modern` in (of `all`, alias voor modern) om deze suite daadwerkelijk uit te voeren; anders wordt deze overgeslagen om `pnpm test:live` gericht te houden op Gateway-smoke
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` om de moderne allowlist uit te voeren (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor de moderne allowlist
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (komma-allowlist)
  - Modern/all-sweeps gebruiken standaard een zorgvuldig gekozen, hoogsignaal-limiet; stel `OPENCLAW_LIVE_MAX_MODELS=0` in voor een uitputtende moderne sweep of een positief getal voor een kleinere limiet.
  - Uitputtende sweeps gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` voor de timeout van de volledige directe-modeltest. Standaard: 60 minuten.
  - Directe-modelprobes draaien standaard met 20-voudige paralleliteit; stel `OPENCLAW_LIVE_MODEL_CONCURRENCY` in om dit te overriden.
- Providers selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (komma-allowlist)
- Waar sleutels vandaan komen:
  - Standaard: profielopslag en env-fallbacks
  - Stel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` in om alleen **profielopslag** af te dwingen
- Waarom dit bestaat:
  - Scheidt “provider-API is kapot / sleutel is ongeldig” van “Gateway-agentpijplijn is kapot”
  - Bevat kleine, geïsoleerde regressies (voorbeeld: OpenAI Responses/Codex Responses reasoning replay + tool-call-flows)

### Laag 2: Gateway + dev-agent-smoke (wat "@openclaw" daadwerkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een in-process Gateway starten
  - Een `agent:dev:*`-sessie maken/patchen (modeloverride per run)
  - Modellen-met-sleutels doorlopen en controleren:
    - “betekenisvolle” respons (geen tools)
    - een echte toolaanroep werkt (leesprobe)
    - optionele extra toolprobes (exec+leesprobe)
    - OpenAI-regressiepaden (alleen tool-call → follow-up) blijven werken
- Probedetails (zodat je fouten snel kunt uitleggen):
  - `read`-probe: de test schrijft een nonce-bestand in de workspace en vraagt de agent om het te `read`en en de nonce terug te echoën.
  - `exec+read`-probe: de test vraagt de agent om met `exec` een nonce naar een tijdelijk bestand te schrijven en die daarna terug te `read`en.
  - afbeeldingsprobe: de test voegt een gegenereerde PNG toe (kat + willekeurige code) en verwacht dat het model `cat <CODE>` retourneert.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `src/gateway/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
- Modellen selecteren:
  - Standaard: moderne allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor de moderne allowlist
  - Of stel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` in (of een kommagescheiden lijst) om te beperken
  - Modern/all-Gateway-sweeps gebruiken standaard een zorgvuldig gekozen, hoogsignaal-limiet; stel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` in voor een uitputtende moderne sweep of een positief getal voor een kleinere limiet.
- Providers selecteren (vermijd “alles van OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (komma-allowlist)
- Tool- en afbeeldingsprobes staan altijd aan in deze live test:
  - `read`-probe + `exec+read`-probe (toolbelasting)
  - afbeeldingsprobe draait wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (hoog niveau):
    - Test genereert een kleine PNG met “CAT” + willekeurige code (`src/gateway/live-image-probe.ts`)
    - Stuurt deze via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parseert attachments naar `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Ingebedde agent stuurt een multimodaal gebruikersbericht door naar het model
    - Assertie: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten toegestaan)

<Tip>
Voer dit uit om te zien wat je op je machine kunt testen (en de exacte `provider/model`-ids):

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI-backend-smoke (Claude, Codex, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: de Gateway + agentpijplijn valideren met een lokale CLI-backend, zonder je standaardconfiguratie aan te raken.
- Backend-specifieke smoke-standaarden staan in de `cli-backend.ts`-definitie van de eigenaar-Plugin.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als je Vitest rechtstreeks aanroept)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaarden:
  - Standaardprovider/-model: `claude-cli/claude-sonnet-4-6`
  - Commando-/arg-/afbeeldingsgedrag komt uit de metadata van de eigenaar-CLI-backend-Plugin.
- Overrides (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeeldingsbijlage te sturen (paden worden in de prompt geïnjecteerd). Docker-recepten hebben dit standaard uit, tenzij expliciet gevraagd.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-args door te geven in plaats van promptinjectie.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te bepalen hoe afbeeldingsargs worden doorgegeven wanneer `IMAGE_ARG` is ingesteld.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te sturen en de resumeflow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om je aan te melden voor de Claude Sonnet -> Opus-continuïteitsprobe binnen dezelfde sessie wanneer het geselecteerde model een switchdoel ondersteunt. Docker-recepten hebben dit standaard uit voor geaggregeerde betrouwbaarheid.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om je aan te melden voor de MCP/tool-loopbackprobe. Docker-recepten hebben dit standaard uit, tenzij expliciet gevraagd.

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

Dit vraagt Gemini niet om een respons te genereren. Het schrijft dezelfde systeem
instellingen die OpenClaw aan Gemini geeft, en voert daarna `gemini --debug mcp list` uit om te bewijzen dat een
opgeslagen `transport: "streamable-http"`-server wordt genormaliseerd naar Gemini's HTTP-MCP
vorm en kan verbinden met een lokale streamable-HTTP-MCP-server.

Docker-recept:

```bash
pnpm test:docker:live-cli-backend
```

Docker-recepten per provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notities:

- De Docker-runner staat op `scripts/test-live-cli-backend-docker.sh`.
- Deze voert de live CLI-backend-smoke uit binnen de repo-Docker-image als de niet-rootgebruiker `node`.
- Deze haalt CLI-smoke-metadata op uit de eigenaar-extensie, en installeert daarna het bijbehorende Linux-CLI-pakket (`@anthropic-ai/claude-code`, `@openai/codex` of `@google/gemini-cli`) in een gecachte schrijfbare prefix op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist portable Claude Code subscription OAuth via óf `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` óf `CLAUDE_CODE_OAUTH_TOKEN` van `claude setup-token`. Eerst wordt directe `claude -p` in Docker bewezen, daarna worden twee Gateway CLI-backend-beurten uitgevoerd zonder Anthropic API-key-env-vars te behouden. Deze subscription-lane schakelt de Claude MCP/tool- en afbeeldingsprobes standaard uit omdat Claude third-party app-gebruik momenteel via extra-use billing routeert in plaats van via normale limieten van subscription-plannen.
- De live CLI-backend-smoke oefent nu dezelfde end-to-end-flow uit voor Claude, Codex en Gemini: tekstbeurt, afbeeldingsclassificatiebeurt en daarna MCP `cron`-toolaanroep geverifieerd via de Gateway CLI.
- De standaard-smoke van Claude patcht de sessie ook van Sonnet naar Opus en controleert of de hervatte sessie nog steeds een eerdere notitie onthoudt.

## Live: ACP-bind-smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: valideer de echte ACP-gespreksbindflow met een live ACP-agent:
  - stuur `/acp spawn <agent> --bind here`
  - bind een synthetisch berichtkanaalgesprek ter plekke
  - stuur een normale follow-up in datzelfde gesprek
  - verifieer dat de follow-up in het transcript van de gebonden ACP-sessie terechtkomt
- Inschakelen:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standaarden:
  - ACP-agenten in Docker: `claude,codex,gemini`
  - ACP-agent voor directe `pnpm test:live ...`: `claude`
  - Synthetisch kanaal: Slack DM-stijl gesprekscontext
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
  - Deze lane gebruikt het gateway-`chat.send`-oppervlak met synthetische originating-route-velden die alleen voor beheerders zijn, zodat tests berichtkanaalcontext kunnen koppelen zonder te doen alsof er extern wordt afgeleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test het ingebedde `acpx`-Plugin-register met ingebouwde agenten voor de geselecteerde ACP-harnessagent.
  - Het aanmaken van bound-session Cron-MCP is standaard best-effort omdat externe ACP-harnassen MCP-aanroepen kunnen annuleren nadat het bind-/afbeeldingsbewijs is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die post-bind Cron-probe strikt te maken.

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
- Standaard draait die de ACP-bind-smoke achtereenvolgens tegen de geaggregeerde live CLI-agenten: `claude`, `codex`, daarna `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Hij sourcet `~/.profile`, zet het bijpassende CLI-authenticatiemateriaal klaar in de container en installeert daarna de gevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli`, of `opencode-ai`) als die ontbreekt. De ACP-backend zelf is het ingebedde `acpx/runtime`-pakket uit de officiële `acpx`-Plugin.
- De Droid-Docker-variant zet `~/.factory` klaar voor instellingen, geeft `FACTORY_API_KEY` door en vereist die API-sleutel omdat lokale Factory OAuth-/keyring-authenticatie niet overdraagbaar is naar de container. Hij gebruikt ACPX's ingebouwde `droid exec --output-format acp`-registeritem.
- De OpenCode-Docker-variant is een strikte regressielane voor één agent. Hij schrijft een tijdelijk standaardmodel `OPENCODE_CONFIG_CONTENT` vanuit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`) na het sourcen van `~/.profile`, en `pnpm test:docker:live-acp-bind:opencode` vereist een gebonden assistenttranscript in plaats van de generieke post-bind-skip te accepteren.
- Directe `acpx`-CLI-aanroepen zijn alleen een handmatig/workaroundpad om gedrag buiten de Gateway te vergelijken. De Docker ACP-bind-smoke test OpenClaw's ingebedde `acpx`-runtimebackend.

## Live: Codex app-server harness-smoke

- Doel: valideer de Plugin-beheerde Codex-harness via de normale gateway-
  `agent`-methode:
  - laad de gebundelde `codex`-Plugin
  - selecteer `OPENCLAW_AGENT_RUNTIME=codex`
  - stuur een eerste gateway-agentbeurt naar `openai/gpt-5.5` met de Codex-harness geforceerd
  - stuur een tweede beurt naar dezelfde OpenClaw-sessie en verifieer dat de app-server-
    thread kan hervatten
  - voer `/codex status` en `/codex models` uit via hetzelfde gateway-commandopad
  - voer optioneel twee door Guardian beoordeelde geëscaleerde shellprobes uit: één onschuldige
    command die goedgekeurd zou moeten worden en één nep-secret-upload die geweigerd zou moeten
    worden zodat de agent terugvraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standaardmodel: `openai/gpt-5.5`
- Optionele afbeeldingsprobe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP-/toolprobe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoke stelt `OPENCLAW_AGENT_HARNESS_FALLBACK=none` in zodat een kapotte Codex-
  harness niet kan slagen door stil terug te vallen op PI.
- Auth: Codex app-server-authenticatie uit de lokale Codex-abonnementslogin. Docker-
  smokes kunnen ook `OPENAI_API_KEY` meegeven voor niet-Codex-probes waar van toepassing,
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
- Hij sourcet de gemounte `~/.profile`, geeft `OPENAI_API_KEY` door, kopieert Codex CLI-
  authbestanden wanneer aanwezig, installeert `@openai/codex` in een beschrijfbare gemounte npm-
  prefix, zet de source tree klaar en draait daarna alleen de Codex-harness-livetest.
- Docker schakelt de afbeeldings-, MCP-/tool- en Guardian-probes standaard in. Stel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer je een smallere debug-
  run nodig hebt.
- Docker exporteert ook `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, overeenkomstig de live-
  testconfiguratie, zodat legacy-aliassen of PI-fallback een Codex-harness-
  regressie niet kunnen verbergen.

### Aanbevolen live-recepten

Smalle, expliciete allowlists zijn het snelst en het minst flaky:

- Eén model, direct (geen gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Eén model, gateway-smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Toolaanroepen over meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-focus (Gemini API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive-thinking-smoke:
  - Als lokale sleutels in het shellprofiel staan: `source ~/.profile`
  - Gemini 3 dynamische standaard: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamisch budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Opmerkingen:

- `google/...` gebruikt de Gemini API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity OAuth-bridge (Cloud Code Assist-achtige agent-endpoint).
- `google-gemini-cli/...` gebruikt de lokale Gemini CLI op je machine (aparte authenticatie + tooling-eigenaardigheden).
- Gemini API versus Gemini CLI:
  - API: OpenClaw roept Google's gehoste Gemini API aan via HTTP (API-sleutel / profielauthenticatie); dit is wat de meeste gebruikers bedoelen met "Gemini".
  - CLI: OpenClaw roept een lokale `gemini`-binary aan via de shell; die heeft eigen authenticatie en kan zich anders gedragen (streaming-/toolondersteuning/versiescheefstand).

## Live: modelmatrix (wat we dekken)

Er is geen vaste "CI-modellenlijst" (live is opt-in), maar dit zijn de **aanbevolen** modellen om regelmatig te dekken op een ontwikkelmachine met sleutels.

### Moderne smoke-set (toolaanroepen + afbeelding)

Dit is de run met "gangbare modellen" waarvan we verwachten dat die blijft werken:

- OpenAI (niet-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` en `google/gemini-3-flash-preview` (vermijd oudere Gemini 2.x-modellen)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` en `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` en `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Draai gateway-smoke met tools + afbeelding:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: toolaanroepen (Read + optionele Exec)

Kies minstens één per providerfamilie:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (of `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (of `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Optionele extra dekking (goed om te hebben):

- xAI: `xai/grok-4.3` (of nieuwste beschikbare)
- Mistral: `mistral/`… (kies één model met "tools"-capaciteit dat je hebt ingeschakeld)
- Cerebras: `cerebras/`… (als je toegang hebt)
- LM Studio: `lmstudio/`… (lokaal; toolaanroepen hangen af van API-modus)

### Visie: afbeelding verzenden (bijlage → multimodaal bericht)

Neem minstens één model met afbeeldingsondersteuning op in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI-varianten met visieondersteuning, enz.) om de afbeeldingsprobe te testen.

### Aggregators / alternatieve gateways

Als je sleutels hebt ingeschakeld, ondersteunen we ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten te vinden die tools+afbeeldingen ondersteunen)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (authenticatie via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die je kunt opnemen in de live-matrix (als je credentials/configuratie hebt):

- Ingebouwd: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (aangepaste endpoints): `minimax` (cloud/API), plus elke OpenAI-/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM, enz.)

<Tip>
Hardcode geen "alle modellen" in docs. De gezaghebbende lijst is wat `discoverModels(...)` op je machine retourneert plus de sleutels die beschikbaar zijn.
</Tip>

## Credentials (nooit committen)

Live tests ontdekken credentials op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, zouden livetests dezelfde sleutels moeten vinden.
- Als een livetest “no creds” meldt, debug dan op dezelfde manier als je `openclaw models list` / modelselectie zou debuggen.

- Auth-profielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit is wat “profile keys” betekent in de livetests)
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Verouderde statusmap: `~/.openclaw/credentials/` (wordt gekopieerd naar de staged live-home wanneer aanwezig, maar is niet de hoofdopslag voor profielsleutels)
- Lokale liveruns kopiëren standaard de actieve configuratie, `auth-profiles.json`-bestanden per agent, verouderde `credentials/` en ondersteunde externe CLI-authmappen naar een tijdelijke test-home; staged live-homes slaan `workspace/` en `sandboxes/` over, en padoverschrijvingen voor `agents.*.workspace` / `agentDir` worden verwijderd zodat probes wegblijven van je echte host-workspace.

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
- Bereik:
  - Oefent de gebundelde paden voor comfy-afbeelding, video en `music_generate`
  - Slaat elke capability over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen aan comfy-workflowindiening, polling, downloads of Plugin-registratie

## Afbeeldingsgeneratie live

- Test: `test/image-generation.runtime.live.test.ts`
- Commando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harnas: `pnpm test:live:media image`
- Bereik:
  - Somt elke geregistreerde provider-Plugin voor afbeeldingsgeneratie op
  - Laadt ontbrekende provider-omgevingsvariabelen uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live/API-sleutels uit de omgeving vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shellreferenties niet maskeren
  - Slaat providers over zonder bruikbare auth/profiel/model
  - Voert elke geconfigureerde provider uit via de gedeelde runtime voor afbeeldingsgeneratie:
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
- Optionele versmalling:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth uit de profielopslag af te dwingen en overschrijvingen alleen uit de omgeving te negeren

Voeg voor het meegeleverde CLI-pad een `infer`-smoke toe nadat de provider/runtime-livetest is geslaagd:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dit dekt CLI-argumentparsing, oplossing van configuratie/standaardagent, activering van gebundelde Plugins, de gedeelde runtime voor afbeeldingsgeneratie en de live provider-aanvraag. Plugin-afhankelijkheden worden verwacht aanwezig te zijn voordat de runtime wordt geladen.

## Muziekgeneratie live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnas: `pnpm test:live:media music`
- Bereik:
  - Oefent het gedeelde gebundelde providerpad voor muziekgeneratie
  - Dekt momenteel Google en MiniMax
  - Laadt provider-omgevingsvariabelen uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live/API-sleutels uit de omgeving vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shellreferenties niet maskeren
  - Slaat providers over zonder bruikbare auth/profiel/model
  - Voert beide gedeclareerde runtimemodi uit wanneer beschikbaar:
    - `generate` met invoer met alleen een prompt
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - Huidige dekking van de gedeelde lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: apart Comfy-livebestand, niet deze gedeelde sweep
- Optionele versmalling:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth uit de profielopslag af te dwingen en overschrijvingen alleen uit de omgeving te negeren

## Videogeneratie live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnas: `pnpm test:live:media video`
- Bereik:
  - Oefent het gedeelde gebundelde providerpad voor videogeneratie
  - Gebruikt standaard het release-veilige smoke-pad: niet-FAL-providers, één text-to-video-aanvraag per provider, een kreeftprompt van één seconde en een bewerkingslimiet per provider vanuit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`)
  - Slaat FAL standaard over omdat wachtrijlatentie aan providerzijde de releasetijd kan domineren; geef `--video-providers fal` of `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` door om die expliciet uit te voeren
  - Laadt provider-omgevingsvariabelen uit je login-shell (`~/.profile`) voordat er wordt geprobed
  - Gebruikt standaard live/API-sleutels uit de omgeving vóór opgeslagen auth-profielen, zodat verouderde testsleutels in `auth-profiles.json` echte shellreferenties niet maskeren
  - Slaat providers over zonder bruikbare auth/profiel/model
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transformatiemodi uit te voeren wanneer beschikbaar:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokale afbeeldingsinvoer met bufferondersteuning accepteert in de gedeelde sweep
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider/het geselecteerde model lokale video-invoer met bufferondersteuning accepteert in de gedeelde sweep
  - Huidige gedeclareerde maar overgeslagen `imageToVideo`-providers in de gedeelde sweep:
    - `vydra` omdat gebundelde `veo3` alleen tekst ondersteunt en gebundelde `kling` een externe afbeeldings-URL vereist
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - dat bestand voert `veo3` text-to-video uit plus een `kling`-lane die standaard een externe afbeeldings-URL-fixture gebruikt
  - Huidige live-dekking voor `videoToVideo`:
    - alleen `runway` wanneer het geselecteerde model `runway/gen4_aleph` is
  - Huidige gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde sweep:
    - `alibaba`, `qwen`, `xai` omdat die paden momenteel externe `http(s)` / MP4-referentie-URL’s vereisen
    - `google` omdat de huidige gedeelde Gemini/Veo-lane lokale invoer met bufferondersteuning gebruikt en dat pad niet wordt geaccepteerd in de gedeelde sweep
    - `openai` omdat de huidige gedeelde lane geen garanties heeft voor organisatiespecifieke toegang tot video-inpaint/remix
- Optionele versmalling:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaardsweep op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de bewerkingslimiet per provider te verlagen voor een agressieve smoke-run
- Optioneel auth-gedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om auth uit de profielopslag af te dwingen en overschrijvingen alleen uit de omgeving te negeren

## Live mediaharnas

- Commando: `pnpm test:live:media`
- Doel:
  - Voert de gedeelde live suites voor afbeeldingen, muziek en video uit via één repo-native entrypoint
  - Laadt ontbrekende provider-omgevingsvariabelen automatisch uit `~/.profile`
  - Versmalt elke suite standaard automatisch tot providers die momenteel bruikbare auth hebben
  - Hergebruikt `scripts/test-live.mjs`, zodat Heartbeat- en stillemodusgedrag consistent blijven
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) — unit-, integratie-, QA- en Docker-suites
