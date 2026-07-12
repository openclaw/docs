---
read_when:
    - Live-modelmatrix-/CLI-backend-/ACP-/mediaprovidersmoketests uitvoeren
    - Foutopsporing van de referentieoplossing voor live-tests
    - Een nieuwe providerspecifieke live-test toevoegen
sidebarTitle: Live tests
summary: 'Live-tests (met netwerktoegang): modelmatrix, CLI-backends, ACP, mediaproviders, inloggegevens'
title: 'Testen: livesuites'
x-i18n:
    generated_at: "2026-07-12T09:00:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Voor een snelle start, QA-runners, unit-/integratiesuites en Docker-flows, zie
[Testen](/nl/help/testing). Deze pagina behandelt **live** tests (die het netwerk gebruiken):
modelmatrix, CLI-backends, ACP, mediaproviders en het omgaan met aanmeldgegevens.

## Live: lokale smoke-opdrachten

Exporteer vóór ad-hoc-livecontroles de benodigde providersleutel in de procesomgeving.

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

`voicecall smoke` is een proefuitvoering tenzij ook `--yes` aanwezig is; gebruik `--yes` alleen
wanneer u daadwerkelijk een oproep wilt plaatsen. Voor Twilio, Telnyx en Plivo vereist een
geslaagde gereedheidscontrole een openbare Webhook-URL; lokale/privé-
local loopback-URL's worden geweigerd omdat deze providers ze niet kunnen bereiken.

## Live: inventarisatie van Android-Node-mogelijkheden

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Doel: **elke momenteel geadverteerde opdracht** van een verbonden Android-Node aanroepen en het gedrag van het opdrachtcontract controleren.
- Bereik:
  - Vooraf geconfigureerde/handmatige installatie (de suite installeert, start of koppelt de app niet).
  - Opdrachtgewijze validatie van Gateway-`node.invoke` voor de geselecteerde Android-Node.
- Vereiste voorafgaande configuratie:
  - Android-app is al verbonden met en gekoppeld aan de Gateway.
  - App blijft op de voorgrond.
  - Toestemmingen/opnametoestemming zijn verleend voor de mogelijkheden waarvan u verwacht dat ze slagen.
- Optionele doeloverschrijvingen:
  - `OPENCLAW_ANDROID_NODE_ID` of `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Volledige details over Android-configuratie: [Android-app](/nl/platforms/android)

## Live: model-smoketest (profielsleutels)

Live-modeltests zijn opgesplitst in twee lagen, zodat fouten geïsoleerd blijven:

- "Direct model" geeft aan of de provider/het model überhaupt kan antwoorden met de opgegeven sleutel.
- "Gateway smoke" geeft aan of de volledige Gateway+-agentpijplijn voor dat model werkt (sessies, geschiedenis, tools, sandboxbeleid enzovoort).

De hieronder samengestelde modellijsten staan in `src/agents/live-model-filter.ts` en
veranderen in de loop van de tijd; beschouw de arrays daar als de gezaghebbende bron, niet deze
pagina.

MiniMax M3 gebruikt `minimax/MiniMax-M3` als standaardreferentie voor provider/model.

### Laag 1: directe modelvoltooiing (zonder Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Doel:
  - Ontdekte modellen inventariseren
  - `getApiKeyForModel` gebruiken om modellen te selecteren waarvoor u aanmeldgegevens hebt
  - Een kleine voltooiing per model uitvoeren (en waar nodig gerichte regressietests)
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als u Vitest rechtstreeks aanroept)
  - Stel `OPENCLAW_LIVE_MODELS=modern`, `small` of `all` (alias voor `modern`) in om deze suite daadwerkelijk uit te voeren; anders wordt deze overgeslagen, zodat alleen `pnpm test:live` gericht blijft op de Gateway-smoketest.
- Modellen selecteren:
  - `OPENCLAW_LIVE_MODELS=modern` voert de samengestelde prioriteitslijst met hoge signaalwaarde uit (zie [Live: modelmatrix](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` voert de samengestelde prioriteitslijst met kleine modellen uit
  - `OPENCLAW_LIVE_MODELS=all` is een alias voor `modern`
  - of `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (door komma's gescheiden toelatingslijst)
  - Lokale uitvoeringen met kleine Ollama-modellen gebruiken standaard `http://127.0.0.1:11434`; stel `OPENCLAW_LIVE_OLLAMA_BASE_URL` alleen in voor LAN-, aangepaste of Ollama Cloud-eindpunten.
  - Inventarisaties voor modern/all en small gebruiken standaard de lengte van hun samengestelde lijst als limiet; stel `OPENCLAW_LIVE_MAX_MODELS=0` in voor een volledige inventarisatie van de geselecteerde profielen of een positief getal voor een lagere limiet.
  - Volledige inventarisaties gebruiken `OPENCLAW_LIVE_TEST_TIMEOUT_MS` als time-out voor de gehele directe-modeltest. Standaard: 60 minuten.
  - Directe-modelcontroles worden standaard met een parallellisme van 20 uitgevoerd; stel `OPENCLAW_LIVE_MODEL_CONCURRENCY` in om dit te overschrijven.
- Providers selecteren:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (door komma's gescheiden toelatingslijst)
- Herkomst van sleutels:
  - Standaard: profielopslag en terugvalwaarden uit omgevingsvariabelen
  - Stel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` in om uitsluitend **profielopslag** af te dwingen
- Reden van bestaan:
  - Maakt onderscheid tussen "provider-API is defect / sleutel is ongeldig" en "Gateway-agentpijplijn is defect"
  - Bevat kleine, geïsoleerde regressietests (voorbeeld: herhaling van redeneerstappen in OpenAI Responses/Codex Responses + flows voor toolaanroepen)

### Laag 2: Gateway + smoke van ontwikkelagent (wat "@openclaw" daadwerkelijk doet)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Doel:
  - Een Gateway binnen het proces starten
  - Een `agent:dev:*`-sessie maken/aanpassen (modeloverschrijving per uitvoering)
  - Modellen-met-sleutels doorlopen en controleren op:
    - "betekenisvol" antwoord (zonder tools)
    - een echte toolaanroep werkt (leescontrole)
    - optionele extra toolcontroles (uitvoer- en leescontrole)
    - OpenAI-regressiepaden (alleen toolaanroep -> vervolg) blijven werken
- Details van controles (zodat u fouten snel kunt verklaren):
  - `read`-controle: de test schrijft een nonce-bestand in de werkruimte en vraagt de agent dit met `read` te lezen en de nonce terug te geven.
  - `exec+read`-controle: de test vraagt de agent met `exec` een nonce naar een tijdelijk bestand te schrijven en dit daarna met `read` terug te lezen.
  - afbeeldingscontrole: de test voegt een gegenereerde PNG toe (kat + willekeurige code) en verwacht dat het model `cat <CODE>` retourneert.
  - Implementatiereferentie: `src/gateway/gateway-models.profiles.live.test.ts` en `test/helpers/live-image-probe.ts`.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als u Vitest rechtstreeks aanroept)
- Modellen selecteren:
  - Standaard: de samengestelde prioriteitslijst met hoge signaalwaarde (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` voert de samengestelde lijst met kleine modellen door de volledige Gateway+-agentpijplijn
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` is een alias voor `modern`
  - Of stel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (of een door komma's gescheiden lijst) in om de selectie te beperken
  - Gateway-inventarisaties voor modern/all en small gebruiken standaard de lengte van hun samengestelde lijst als limiet; stel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` in voor een volledige geselecteerde inventarisatie of een positief getal voor een lagere limiet.
- Providers selecteren (vermijd "alles via OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (door komma's gescheiden toelatingslijst)
- Tool- en afbeeldingscontroles zijn altijd ingeschakeld in deze live-test:
  - `read`-controle + `exec+read`-controle (toolbelasting)
  - afbeeldingscontrole wordt uitgevoerd wanneer het model ondersteuning voor afbeeldingsinvoer adverteert
  - Flow (op hoofdlijnen):
    - Test genereert een kleine PNG met "CAT" + willekeurige code (`test/helpers/live-image-probe.ts`)
    - Verzendt deze via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway verwerkt bijlagen tot `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Ingesloten agent stuurt een multimodaal gebruikersbericht door naar het model
    - Controle: antwoord bevat `cat` + de code (OCR-tolerantie: kleine fouten zijn toegestaan)

<Tip>
Voer het volgende uit om te zien wat u op uw computer kunt testen (en wat de exacte `provider/model`-id's zijn):

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoketest voor CLI-backend (Claude, Gemini of andere lokale CLI's)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Doel: de Gateway+-agentpijplijn valideren met een lokale CLI-backend, zonder uw standaardconfiguratie te wijzigen.
- Backendspecifieke standaardwaarden voor smoketests staan in de `cli-backend.ts`-definitie van de verantwoordelijke Plugin.
- Inschakelen:
  - `pnpm test:live` (of `OPENCLAW_LIVE_TEST=1` als u Vitest rechtstreeks aanroept)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standaardwaarden:
  - Standaardprovider/-model: `claude-cli/claude-sonnet-4-6`
  - Gedrag van opdrachten/argumenten/afbeeldingen komt uit de metadata van de verantwoordelijke CLI-backend-Plugin.
- Overschrijvingen (optioneel):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` om een echte afbeeldingsbijlage te verzenden (paden worden in de prompt ingevoegd). Standaard uitgeschakeld in Docker-recepten.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` om afbeeldingsbestandspaden als CLI-argumenten door te geven in plaats van ze in de prompt in te voegen.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (of `"list"`) om te bepalen hoe afbeeldingsargumenten worden doorgegeven wanneer `IMAGE_ARG` is ingesteld.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` om een tweede beurt te verzenden en de hervattingsflow te valideren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` om de continuïteitscontrole binnen dezelfde sessie van Claude Sonnet naar Opus in te schakelen wanneer het geselecteerde model een wisseldoel ondersteunt. Standaard uitgeschakeld, ook in Docker-recepten.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` om de MCP-/tool-local loopback-controle in te schakelen. Standaard uitgeschakeld in Docker-recepten.

Voorbeeld:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Goedkope Gemini-MCP-configuratiesmoketest:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Hierbij wordt Gemini niet gevraagd een antwoord te genereren. De test schrijft dezelfde systeeminstellingen
die OpenClaw aan Gemini geeft en voert vervolgens `gemini --debug mcp list` uit om aan te tonen dat een
opgeslagen `transport: "streamable-http"`-server wordt genormaliseerd naar Gemini's HTTP-MCP-
vorm en verbinding kan maken met een lokale streamable-HTTP-MCP-server.

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

Opmerkingen:

- De Docker-runner staat in `scripts/test-live-cli-backend-docker.sh`.
- Deze voert de live-CLI-backend-smoketest uit binnen de Docker-image van de repository als de niet-rootgebruiker `node`.
- Deze leest CLI-smokemetadata uit de verantwoordelijke Plugin en installeert vervolgens het bijpassende Linux-CLI-pakket (`@anthropic-ai/claude-code` of `@google/gemini-cli`) in een beschrijfbaar prefix met cache op `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (standaard: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` is niet langer een gebundelde CLI-backend; gebruik in plaats daarvan `openai/*` met de Codex-app-serverruntime (zie [Live: smoketest voor Codex-app-serverharnas](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` vereist overdraagbare OAuth voor een Claude Code-abonnement via `~/.claude/.credentials.json` met `claudeAiOauth.subscriptionType` of `CLAUDE_CODE_OAUTH_TOKEN` van `claude setup-token`. Eerst wordt een rechtstreekse `claude -p` in Docker aangetoond, waarna twee Gateway-CLI-backendbeurten worden uitgevoerd zonder omgevingsvariabelen voor Anthropic-API-sleutels te behouden. Deze abonnementsroute schakelt de Claude-MCP-/tool- en afbeeldingscontroles standaard uit, omdat deze de gebruikslimieten van het aangemelde abonnement verbruikt en Anthropic het facturerings- en snelheidslimietgedrag van de Claude Agent SDK / `claude -p` kan wijzigen zonder een OpenClaw-release.
- Claude en Gemini ondersteunen via de bovenstaande vlaggen dezelfde reeks controles (tekstbeurt, afbeeldingsclassificatie, MCP-`cron`-toolaanroep, continuïteit bij modelwissel), maar geen van deze controles wordt standaard uitgevoerd; schakel ze indien nodig per vlag in.

## Live: bereikbaarheid van APNs via HTTP/2-proxy

- Test: `src/infra/push-apns-http2.live.test.ts`
- Doel: via een lokale HTTP CONNECT-proxy een tunnel maken naar Apples sandbox-APNs-eindpunt, de APNs-HTTP/2-validatieaanvraag verzenden en controleren dat Apples echte antwoord `403 InvalidProviderToken` via het proxypad terugkomt.
- Inschakelen:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Optionele time-out:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP-bindingssmoketest (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Doel: valideer de echte ACP-gesprekskoppelingsstroom met een live ACP-agent:
  - stuur `/acp spawn <agent> --bind here`
  - koppel ter plaatse een synthetisch gesprek van een berichtenkanaal
  - stuur een normaal vervolgbericht in datzelfde gesprek
  - controleer of het vervolgbericht in het transcript van de gekoppelde ACP-sessie terechtkomt
- Inschakelen:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standaardwaarden:
  - ACP-agents in Docker: `claude,codex,gemini`
  - ACP-agent voor directe uitvoering van `pnpm test:live ...`: `claude`
  - Synthetisch kanaal: gesprekscontext in de stijl van een Slack-DM
  - ACP-backend: `acpx`
- Overschrijvingen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (of `on`/`true`/`yes`) om de afbeeldingscontrole geforceerd in te schakelen; elke andere waarde schakelt deze geforceerd uit. Wordt standaard uitgevoerd voor elke agent behalve `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Opmerkingen:
  - Dit testtraject gebruikt het Gateway-oppervlak `chat.send` met uitsluitend voor beheerders beschikbare synthetische velden voor de oorspronkelijke route, zodat tests berichtenkanaalcontext kunnen koppelen zonder te doen alsof er extern wordt afgeleverd.
  - Wanneer `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` niet is ingesteld, gebruikt de test het ingebouwde agentregister van de geïntegreerde `acpx`-Plugin voor de geselecteerde ACP-testharnasagent.
  - Het aanmaken van gebonden-sessie-Cron via MCP gebeurt standaard naar beste vermogen, omdat externe ACP-testharnassen MCP-aanroepen kunnen annuleren nadat het koppelings-/afbeeldingsbewijs is geslaagd; stel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` in om die Cron-controle na het koppelen strikt te maken.

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

- De Docker-runner staat in `scripts/test-live-acp-bind-docker.sh`.
- Standaard voert deze de ACP-koppelingssmoketest achtereenvolgens uit voor de verzamelde live CLI-agents: `claude`, `codex` en vervolgens `gemini`.
- Gebruik `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` of `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` om de matrix te beperken.
- Het bijpassende CLI-authenticatiemateriaal wordt in de container klaargezet, waarna indien nodig de aangevraagde live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` of `opencode-ai`) wordt geïnstalleerd. De ACP-backend zelf is het geïntegreerde pakket `acpx/runtime` van de officiële `acpx`-Plugin.
- De Docker-variant voor Droid zet `~/.factory` klaar voor instellingen, geeft `FACTORY_API_KEY` door en vereist deze API-sleutel, omdat lokale Factory-authenticatie via OAuth/sleutelring niet overdraagbaar is naar de container. Deze variant gebruikt de ingebouwde registervermelding `droid exec --output-format acp` van ACPX.
- De Docker-variant voor OpenCode is een strikt regressietraject voor één agent. Deze schrijft een tijdelijk standaardmodel voor `OPENCODE_CONFIG_CONTENT` vanuit `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (standaard `opencode/kimi-k2.6`).
- Rechtstreekse aanroepen van de `acpx`-CLI zijn uitsluitend een handmatige/alternatieve route om gedrag buiten de Gateway te vergelijken. De Docker-smoketest voor ACP-koppeling test de geïntegreerde `acpx`-runtimebackend van OpenClaw.

## Live: smoketest voor het Codex-app-server-testharnas

- Doel: valideer het door de Plugin beheerde Codex-testharnas via de normale Gateway-methode
  `agent`:
  - laad de meegeleverde `codex`-Plugin
  - selecteer een OpenAI-model via `/model <ref> --runtime codex`
  - stuur een eerste Gateway-agentbeurt met het aangevraagde denkniveau
  - stuur een tweede beurt naar dezelfde OpenClaw-sessie en controleer of de app-server-
    thread kan worden hervat
  - voer `/codex status` en `/codex models` uit via hetzelfde Gateway-commandopad
  - voer optioneel twee door Guardian beoordeelde shellcontroles met verhoogde bevoegdheden uit: één onschuldige
    opdracht die moet worden goedgekeurd en één upload met een nepgeheim die moet worden
    geweigerd, zodat de agent om bevestiging vraagt
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Basismodel voor het testharnas: `openai/gpt-5.6-luna`
- Standaardselectie voor een nieuwe OpenAI-API-sleutel: `openai/gpt-5.6`
- Standaard denkniveau: `low`
- Modeloverschrijving: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Overschrijving van denkniveau: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Matrixoverschrijving: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Authenticatiemodus: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (standaard) gebruikt de
  gekopieerde Codex-aanmelding; `api-key` gebruikt `OPENAI_API_KEY` via de Codex-app-server.
- Optionele afbeeldingscontrole: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionele MCP-/hulpmiddelcontrole: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Optionele Guardian-controle: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- De smoketest dwingt `agentRuntime.id: "codex"` af voor provider/model, zodat een defect Codex-
  testharnas niet kan slagen door stilzwijgend terug te vallen op OpenClaw.
- Authenticatie: authenticatie van de Codex-app-server via de lokale aanmelding voor een Codex-abonnement, of
  `OPENAI_API_KEY` wanneer `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker kan
  `~/.codex/auth.json` en `~/.codex/config.toml` kopiëren voor uitvoeringen met een abonnement.

Lokaal recept:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-recept:

```bash
pnpm test:docker:live-codex-harness
```

Native Codex-matrix voor GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Standaardwaarde voor een nieuwe OpenAI-API-sleutel:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Dit bewijs laat `OPENCLAW_LIVE_GATEWAY_MODELS` oningesteld, bepaalt het model via
het nieuwe selectiemechanisme voor inferentie tijdens de ingebruikname, controleert `openai/gpt-5.6` en voert vervolgens
een echte Gateway-beurt uit met dat bepaalde model.

Geïntegreerde OpenClaw-matrix voor GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker-opmerkingen:

- De Docker-runner staat in `scripts/test-live-codex-harness-docker.sh`.
- Deze geeft `OPENAI_API_KEY` door, kopieert Codex-CLI-authenticatiebestanden wanneer die aanwezig zijn, installeert
  `@openai/codex` in een beschrijfbaar aangekoppeld npm-
  voorvoegsel, zet de bronstructuur klaar en voert vervolgens uitsluitend de live test voor het Codex-testharnas uit.
- Docker schakelt standaard de afbeeldings-, MCP-/hulpmiddel- en Guardian-controles in. Stel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` of
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` in wanneer u een beperktere foutopsporings-
  uitvoering nodig hebt.
- Docker gebruikt dezelfde expliciete Codex-runtimeconfiguratie, zodat verouderde aliassen of terugval op OpenClaw
  een regressie in het Codex-testharnas niet kunnen verbergen.
- Matrixdoelen worden achtereenvolgens in één container uitgevoerd. Het Docker-script schaalt de
  standaardtime-out van 35 minuten op basis van het aantal doelen; elke buitenste shell- of CI-time-out moet
  dezelfde totale tijd toestaan. De canonieke CI houdt elk GPT-5.6-doel in een afzonderlijke shard.

### Aanbevolen live recepten

Beperkte, expliciete toelatingslijsten zijn het snelst en het minst foutgevoelig:

- Eén model, rechtstreeks (zonder Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Rechtstreeks profiel voor kleine modellen:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Gateway-profiel voor kleine modellen:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud-API-smoketest:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Eén model, Gateway-smoketest:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Hulpmiddelaanroepen bij meerdere providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Rechtstreekse Z.AI Coding Plan GLM-5.2-smoketest:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google-focus (Gemini-API-sleutel + Antigravity):
  - Gemini (API-sleutel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-smoketest voor adaptief denken (`qa manual` vanuit de privé-QA-CLI — vereist `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` en een broncheckout; zie [QA-overzicht](/nl/concepts/qa-e2e-automation)):
  - Dynamische standaardwaarde van Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamisch budget van Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Opmerkingen:

- `google/...` gebruikt de Gemini-API (API-sleutel).
- `google-antigravity/...` gebruikt de Antigravity-OAuth-brug (agent-eindpunt in Cloud Code Assist-stijl).
- `google-gemini-cli/...` gebruikt de lokale Gemini-CLI op uw computer (afzonderlijke authenticatie en eigenaardigheden in de hulpmiddelen).
- Gemini-API versus Gemini-CLI:
  - API: OpenClaw roept de gehoste Gemini-API van Google aan via HTTP (API-sleutel/profielauthenticatie); dit is wat de meeste gebruikers met "Gemini" bedoelen.
  - CLI: OpenClaw roept een lokaal binair bestand `gemini` aan via de shell; dit heeft eigen authenticatie en kan zich anders gedragen (streaming-/hulpmiddelondersteuning/versieverschillen).

## Live: modelmatrix (wat we afdekken)

Live is optioneel, dus er is geen vaste "CI-modellenlijst". `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (en hun alias `all`) voeren de samengestelde prioriteitenlijst uit `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` in `src/agents/live-model-filter.ts` uit, in deze prioriteitsvolgorde:

| Provider/model                                | Opmerkingen |
| --------------------------------------------- | ----------- |
| `anthropic/claude-opus-4-8`                   |             |
| `anthropic/claude-sonnet-5`                   |             |
| `anthropic/claude-sonnet-4-6`                 |             |
| `anthropic/claude-opus-4-7`                   |             |
| `google/gemini-3.1-pro-preview`               | Gemini API  |
| `google/gemini-3.5-flash`                     | Gemini API  |
| `cohere/command-a-plus-05-2026`               |             |
| `moonshot/kimi-k2.7-code`                     |             |
| `anthropic/claude-opus-4-6`                   |             |
| `deepseek/deepseek-v4-flash`                  |             |
| `deepseek/deepseek-v4-pro`                    |             |
| `minimax/MiniMax-M3`                          |             |
| `openai/gpt-5.5`                              |             |
| `openrouter/openai/gpt-5.2-chat`              |             |
| `openrouter/minimax/minimax-m2.7`             |             |
| `opencode-go/glm-5`                           |             |
| `openrouter/ai21/jamba-large-1.7`             |             |
| `xai/grok-4.5`                                |             |
| `xai/grok-4.20-0309-reasoning`                |             |
| `zai/glm-5.1`                                 |             |
| `fireworks/accounts/fireworks/models/glm-5p1` |             |
| `minimax-portal/minimax-m3`                   |             |

De samengestelde lijst met **kleine modellen** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), uit `SMALL_LIVE_MODEL_PRIORITY`:

| Provider/model               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Opmerkingen over de moderne lijst:

- De providers `codex` en `codex-cli` zijn uitgesloten van de standaard moderne reeks (ze bestrijken het gedrag van de CLI-backend/ACP, dat hierboven afzonderlijk wordt getest). `openai/gpt-5.5` zelf wordt standaard via de Codex-app-servertestomgeving geleid; zie [Live: rooktest voor de Codex-app-servertestomgeving](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` en `xai` voeren in de moderne reeks alleen hun expliciet samengestelde model-id's uit (geen automatische uitbreiding naar "elk model van deze provider").
- Neem ten minste één model met afbeeldingsondersteuning (Claude/Gemini/OpenAI-varianten met beeldondersteuning enzovoort) op in `OPENCLAW_LIVE_GATEWAY_MODELS` om de afbeeldingstest uit te voeren.

Voer de Gateway-rooktest met hulpmiddelen en een afbeelding uit voor een handmatig geselecteerde reeks van verschillende providers:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Optionele aanvullende dekking buiten de samengestelde lijsten (wenselijk maar niet vereist; kies een model met ondersteuning voor "hulpmiddelen" dat u hebt ingeschakeld):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (als u toegang hebt)
- LM Studio: `lmstudio/...` (lokaal; het aanroepen van hulpmiddelen is afhankelijk van de API-modus)

### Aggregators / alternatieve gateways

Als u sleutels hebt ingeschakeld, kunt u ook testen via:

- OpenRouter: `openrouter/...` (honderden modellen; gebruik `openclaw models scan` om kandidaten te vinden die hulpmiddelen en afbeeldingen ondersteunen)
- OpenCode: `opencode/...` voor Zen en `opencode-go/...` voor Go (authenticatie via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Meer providers die u in de live-matrix kunt opnemen (als u referenties/configuratie hebt):

- Ingebouwd: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Via `models.providers` (aangepaste eindpunten): `minimax` (cloud/API), plus elke OpenAI-/Anthropic-compatibele proxy (LM Studio, vLLM, LiteLLM enzovoort)

<Tip>
Leg niet "alle modellen" vast in de documentatie. De gezaghebbende lijst bestaat uit wat `discoverModels(...)` op uw computer retourneert, aangevuld met de beschikbare sleutels.
</Tip>

## Referenties (nooit vastleggen in versiebeheer)

Live-tests vinden referenties op dezelfde manier als de CLI. Praktische gevolgen:

- Als de CLI werkt, moeten live-tests dezelfde sleutels vinden.
- Als een live-test "no creds" meldt, voert u de foutopsporing op dezelfde manier uit als voor `openclaw models list` / modelselectie.

- Authenticatieprofielen per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (dit wordt in de live-tests bedoeld met "profielsleutels")
- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Verouderde OAuth-map: `~/.openclaw/credentials/` (wordt indien aanwezig naar de voorbereide live-thuismap gekopieerd, maar is niet de hoofdopslag voor profielsleutels)
- Lokale live-uitvoeringen kopiëren de actieve configuratie (waarbij overschrijvingen van `agents.*.workspace` / `agentDir` worden verwijderd) en het bestand `auth-profiles.json` van elke agent — niet de rest van de map van die agent, zodat gegevens uit `workspace/` en `sandboxes/` nooit in de voorbereide thuismap terechtkomen — plus de verouderde map `credentials/` en ondersteunde authenticatiebestanden/-mappen van externe CLI's (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) naar een tijdelijke testthuismap.

Als u omgevingssleutels wilt gebruiken, exporteert u deze vóór lokale tests of gebruikt u de
onderstaande Docker-runners met een expliciet `OPENCLAW_PROFILE_FILE`.

## Deepgram live (audiotranscriptie)

- Test: `extensions/deepgram/audio.live.test.ts`
- Inschakelen: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus-coderingsabonnement live

- Test: `extensions/byteplus/live.test.ts`
- Inschakelen: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Optionele modeloverschrijving: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-workflowmedia live

- Test: `extensions/comfy/comfy.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Bereik:
  - Test de gebundelde comfy-paden voor afbeeldingen, video en `music_generate`
  - Slaat elke mogelijkheid over tenzij `plugins.entries.comfy.config.<capability>` is geconfigureerd
  - Nuttig na wijzigingen in de indiening van comfy-workflows, polling, downloads of Plugin-registratie

## Afbeeldingsgeneratie live

- Test: `test/image-generation.runtime.live.test.ts`
- Opdracht: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Testomgeving: `pnpm test:live:media image`
- Bereik:
  - Somt elke geregistreerde provider-Plugin voor afbeeldingsgeneratie op
  - Gebruikt reeds geëxporteerde omgevingsvariabelen van providers vóór de test
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen authenticatieprofielen, zodat verouderde testsleutels in `auth-profiles.json` echte shellreferenties niet verhullen
  - Slaat providers zonder bruikbare authenticatie/profiel/model over
  - Voert elke geconfigureerde provider uit via de gedeelde runtime voor afbeeldingsgeneratie:
    - `<provider>:generate`
    - `<provider>:edit` wanneer de provider ondersteuning voor bewerken declareert
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
- Optioneel authenticatiegedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om authenticatie via de profielopslag af te dwingen en overschrijvingen die uitsluitend uit de omgeving komen te negeren

Voeg voor het meegeleverde CLI-pad een `infer`-rooktest toe nadat de live-test
voor de provider/runtime is geslaagd:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimale vlakke testafbeelding: één blauw vierkant op een witte achtergrond, zonder tekst." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Dit omvat het verwerken van CLI-argumenten, het bepalen van de configuratie/standaardagent, de activering van
gebundelde Plugins, de gedeelde runtime voor afbeeldingsgeneratie en de live-aanvraag
bij de provider. Er wordt verwacht dat Plugin-afhankelijkheden vóór het laden van de runtime aanwezig zijn.

## Muziekgeneratie live

- Test: `extensions/music-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Testomgeving: `pnpm test:live:media music`
- Bereik:
  - Test het gedeelde gebundelde providerpad voor muziekgeneratie
  - Dekt momenteel `fal`, `google`, `minimax` en `openrouter`
  - Gebruikt reeds geëxporteerde omgevingsvariabelen van providers vóór de test
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen authenticatieprofielen, zodat verouderde testsleutels in `auth-profiles.json` echte shellreferenties niet verhullen
  - Slaat providers zonder bruikbare authenticatie/profiel/model over
  - Voert beide gedeclareerde runtimemodi uit wanneer deze beschikbaar zijn:
    - `generate` met alleen een prompt als invoer
    - `edit` wanneer de provider `capabilities.edit.enabled` declareert
  - `comfy` heeft een eigen afzonderlijk live-bestand en maakt geen deel uit van deze gedeelde reeks
- Optionele beperking:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Optioneel authenticatiegedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om authenticatie via de profielopslag af te dwingen en overschrijvingen die uitsluitend uit de omgeving komen te negeren

## Videogeneratie live

- Test: `extensions/video-generation-providers.live.test.ts`
- Inschakelen: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Testharnas: `pnpm test:live:media video`
- Bereik:
  - Test het gedeelde pad voor gebundelde videogeneratieproviders voor `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Gebruikt standaard het releaseveilige smoke-testpad: één tekst-naar-videoverzoek per provider, een prompt van één seconde met een kreeft en een bewerkingslimiet per provider uit `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`)
  - Slaat FAL standaard over omdat wachtrijvertraging aan de providerzijde de releasetijd kan domineren; geef `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` door (of maak de lijst met over te slaan providers leeg) om deze expliciet uit te voeren
  - Gebruikt reeds geëxporteerde omgevingsvariabelen van providers voordat er wordt gepeild
  - Gebruikt standaard live-/omgevings-API-sleutels vóór opgeslagen authenticatieprofielen, zodat verouderde testsleutels in `auth-profiles.json` echte shellreferenties niet maskeren
  - Slaat providers zonder bruikbare authenticatie, bruikbaar profiel of model over
  - Voert standaard alleen `generate` uit
  - Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde transformatiemodi uit te voeren wanneer die beschikbaar zijn:
    - `imageToVideo` wanneer de provider `capabilities.imageToVideo.enabled` declareert en de geselecteerde provider en het geselecteerde model in de gedeelde testronde lokale afbeeldingsinvoer uit een buffer accepteren
    - `videoToVideo` wanneer de provider `capabilities.videoToVideo.enabled` declareert en de geselecteerde provider en het geselecteerde model in de gedeelde testronde lokale video-invoer uit een buffer accepteren
  - Momenteel gedeclareerde maar overgeslagen `imageToVideo`-provider in de gedeelde testronde:
    - `vydra` (lokale afbeeldingsinvoer uit een buffer wordt in deze testbaan niet ondersteund)
  - Providerspecifieke Vydra-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Dat bestand voert `veo3`-tekst-naar-video uit, plus een `kling`-afbeelding-naar-videotestbaan die standaard een fixture met een externe afbeeldings-URL gebruikt (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` om deze te overschrijven).
  - Providerspecifieke xAI-dekking:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Het klassieke geval genereert eerst een vierkante lokale PNG als eerste frame, laat geometrie weg, vraagt een afbeelding-naar-videoclip van één seconde aan, peilt tot voltooiing en verifieert de gedownloade buffer.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Het 1.5-geval genereert een lokale PNG als eerste frame, vraagt een afbeelding-naar-videoclip van één seconde in 1080P aan, peilt tot voltooiing en verifieert de gedownloade buffer.
  - Huidige live-dekking voor `videoToVideo`:
    - Alleen `runway` wanneer het geselecteerde model wordt herleid tot `gen4_aleph`
  - Momenteel gedeclareerde maar overgeslagen `videoToVideo`-providers in de gedeelde testronde:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, omdat die paden momenteel externe `http(s)`-referentie-URL's vereisen in plaats van lokale invoer uit een buffer
- Optionele beperking:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` om elke provider in de standaard testronde op te nemen, inclusief FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` om de bewerkingslimiet per provider te verlagen voor een agressieve smoke-test
- Optioneel authenticatiegedrag:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` om authenticatie via de profielopslag af te dwingen en overschrijvingen die alleen in de omgeving staan te negeren

## Testharnas voor live media

- Opdracht: `pnpm test:live:media`
- Ingangspunt: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, dat per geselecteerde suite `pnpm test:live -- <suite-test-file>` uitvoert, zodat Heartbeat- en stillemodusgedrag consistent blijven met andere uitvoeringen van `pnpm test:live`.
- Doel:
  - Voert de gedeelde live suites voor afbeeldingen, muziek en video uit via één repo-eigen ingangspunt
  - Laadt ontbrekende omgevingsvariabelen van providers automatisch uit `~/.profile`
  - Beperkt elke suite standaard automatisch tot providers die momenteel bruikbare authenticatie hebben
- Vlaggen:
  - `--providers <csv>` globaal providerfilter; `--image-providers` / `--music-providers` / `--video-providers` beperken een filter tot één suite
  - `--all-providers` slaat het automatische filter op basis van authenticatie over
  - `--allow-empty` sluit af met `0` wanneer er na filtering geen uitvoerbare providers overblijven
  - `--quiet` / `--no-quiet` worden doorgegeven aan `test:live`
- Voorbeelden:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Gerelateerd

- [Testen](/nl/help/testing) - unit-, integratie-, QA- en Docker-suites
