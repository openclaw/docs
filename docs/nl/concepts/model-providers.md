---
read_when:
    - Je hebt een referentie voor modelconfiguratie per provider nodig
    - Je wilt voorbeeldconfiguraties of CLI-onboardingopdrachten voor modelproviders
sidebarTitle: Model providers
summary: Overzicht van modelproviders met voorbeeldconfiguraties + CLI-flows
title: Modelproviders
x-i18n:
    generated_at: "2026-06-27T17:27:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Referentie voor **LLM-/modelproviders** (niet chatkanalen zoals WhatsApp/Telegram). Zie [Modellen](/nl/concepts/models) voor regels voor modelselectie.

## Snelle regels

<AccordionGroup>
  <Accordion title="Modelverwijzingen en CLI-helpers">
    - Modelverwijzingen gebruiken `provider/model` (voorbeeld: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` werkt als een toestemmingslijst wanneer dit is ingesteld.
    - CLI-helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` stellen standaardwaarden op providerniveau in; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` overschrijven ze per model.
    - Fallbackregels, cooldown-probes en persistentie van sessie-overschrijvingen: [Modelfailover](/nl/concepts/model-failover).

  </Accordion>
  <Accordion title="Providerauthenticatie toevoegen verandert je primaire model niet">
    `openclaw configure` behoudt een bestaande `agents.defaults.model.primary` wanneer je een provider toevoegt of opnieuw authenticeert. `openclaw models auth login` doet hetzelfde, tenzij je `--set-default` doorgeeft. Provider-Plugins kunnen nog steeds een aanbevolen standaardmodel teruggeven in hun auth-configuratiepatch, maar OpenClaw behandelt dat als "maak dit model beschikbaar" wanneer er al een primair model bestaat, niet als "vervang het huidige primaire model."

    Gebruik `openclaw models set <provider/model>` of `openclaw models auth login --provider <id> --set-default` om bewust van standaardmodel te wisselen.

  </Accordion>
  <Accordion title="Splitsing tussen OpenAI-provider en runtime">
    Routes binnen de OpenAI-familie zijn prefixspecifiek:

    - `openai/<model>` gebruikt standaard het native Codex-app-server-harnas voor agentbeurten. Dit is de gebruikelijke setup voor een ChatGPT/Codex-abonnement.
    - Verouderde Codex-modelverwijzingen zijn verouderde configuratie die doctor herschrijft naar `openai/<model>`.
    - `openai/<model>` plus provider-/model-`agentRuntime.id: "openclaw"` gebruikt de ingebouwde runtime van OpenClaw voor expliciete API-sleutel- of compatibiliteitsroutes.

    Zie [OpenAI](/nl/providers/openai) en [Codex-harnas](/nl/plugins/codex-harness). Als de provider-/runtime-splitsing verwarrend is, lees dan eerst [Agentruntimes](/nl/concepts/agent-runtimes).

    Automatisch inschakelen van Plugins volgt dezelfde grens: agentverwijzingen met `openai/*` schakelen de Codex-Plugin in voor de standaardroute, en expliciete provider-/model-`agentRuntime.id: "codex"` of verouderde `codex/<model>`-verwijzingen vereisen deze ook.

    GPT-5.5 is standaard beschikbaar via het native Codex-app-server-harnas op `openai/gpt-5.5`, en via de OpenClaw-runtime wanneer provider-/model-runtimebeleid expliciet `openclaw` selecteert.

  </Accordion>
  <Accordion title="CLI-runtimes">
    CLI-runtimes gebruiken dezelfde splitsing: kies canonieke modelverwijzingen zoals `anthropic/claude-*` of `google/gemini-*`, en stel vervolgens provider-/model-runtimebeleid in op `claude-cli` of `google-gemini-cli` wanneer je een lokale CLI-backend wilt.

    Verouderde `claude-cli/*`- en `google-gemini-cli/*`-verwijzingen migreren terug naar canonieke providerverwijzingen, waarbij de runtime apart wordt vastgelegd. Verouderde `codex-cli/*`-verwijzingen migreren naar `openai/*` en gebruiken de Codex-app-server-route; OpenClaw behoudt niet langer een gebundelde Codex CLI-backend.

  </Accordion>
</AccordionGroup>

## Provider-eigen gedrag

De meeste providerspecifieke logica leeft in provider-Plugins (`registerProvider(...)`), terwijl OpenClaw de generieke inferentielus beheert. Plugins beheren onboarding, modelcatalogi, mapping van auth-omgevingsvariabelen, transport-/configuratienormalisatie, opschoning van toolschema's, failoverclassificatie, OAuth-verversing, gebruiksrapportage, denk-/redeneerprofielen en meer.

De volledige lijst met provider-SDK-hooks en voorbeelden van gebundelde Plugins staat in [Provider-Plugins](/nl/plugins/sdk-provider-plugins). Een provider die een volledig aangepaste request-executor nodig heeft, is een afzonderlijk, dieper uitbreidingsvlak.

<Note>
Provider-eigen runnergedrag leeft op expliciete providerhooks zoals replaybeleid, toolschema-normalisatie, stream-wrapping en transport-/requesthelpers. De verouderde statische `ProviderPlugin.capabilities`-tas is alleen voor compatibiliteit en wordt niet langer gelezen door gedeelde runnerlogica.
</Note>

## Rotatie van API-sleutels

<AccordionGroup>
  <Accordion title="Sleutelbronnen en prioriteit">
    Configureer meerdere sleutels via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele live-overschrijving, hoogste prioriteit)
    - `<PROVIDER>_API_KEYS` (lijst met komma's of puntkomma's)
    - `<PROVIDER>_API_KEY` (primaire sleutel)
    - `<PROVIDER>_API_KEY_*` (genummerde lijst, bijvoorbeeld `<PROVIDER>_API_KEY_1`)

    Voor Google-providers wordt `GOOGLE_API_KEY` ook opgenomen als fallback. De selectievolgorde van sleutels behoudt prioriteit en ontdubbelt waarden.

  </Accordion>
  <Accordion title="Wanneer rotatie wordt geactiveerd">
    - Requests worden alleen opnieuw geprobeerd met de volgende sleutel bij snelheidslimietresponses (bijvoorbeeld `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` of periodieke berichten over gebruikslimieten).
    - Fouten die geen snelheidslimietfouten zijn, falen direct; er wordt geen sleutelrotatie geprobeerd.
    - Wanneer alle kandidaatsleutels falen, wordt de laatste fout teruggegeven vanuit de laatste poging.

  </Accordion>
</AccordionGroup>

## Officiële provider-Plugins

Officiële provider-Plugins publiceren hun eigen modelcatalogusrijen. Deze providers vereisen **geen** `models.providers`-modelvermeldingen; schakel de provider-Plugin in, stel auth in en kies een model. Gebruik `models.providers` alleen voor expliciete aangepaste providers of beperkte requestinstellingen zoals time-outs.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionele rotatie: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (enkele overschrijving)
- Voorbeeldmodellen: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifieer account-/modelbeschikbaarheid met `openclaw models list --provider openai` als een specifieke installatie of API-sleutel zich anders gedraagt.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standaardtransport is `auto`; OpenClaw geeft de transportkeuze door aan de gedeelde modelruntime.
- Overschrijf per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- OpenAI-prioriteitsverwerking kan worden ingeschakeld via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` en `params.fastMode` mappen directe `openai/*` Responses-requests naar `service_tier=priority` op `api.openai.com`
- Gebruik `params.serviceTier` wanneer je een expliciete tier wilt in plaats van de gedeelde `/fast`-schakelaar
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) gelden alleen voor native OpenAI-verkeer naar `api.openai.com`, niet voor generieke OpenAI-compatibele proxy's
- Native OpenAI-routes behouden ook Responses `store`, prompt-cache-hints en OpenAI-redeneercompatibele payloadvorming; proxyroutes doen dat niet
- `openai/gpt-5.3-codex-spark` is beschikbaar via ChatGPT/Codex OAuth-abonnementsauth wanneer je aangemelde account het beschikbaar stelt; OpenClaw onderdrukt nog steeds directe OpenAI API-sleutel- en Azure API-sleutelroutes voor dit model omdat die transports het weigeren

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionele rotatie: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (enkele overschrijving)
- Voorbeeldmodel: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Directe publieke Anthropic-requests ondersteunen de gedeelde `/fast`-schakelaar en `params.fastMode`, inclusief API-sleutel- en OAuth-geauthenticeerd verkeer dat naar `api.anthropic.com` wordt gestuurd; OpenClaw mapt dat naar Anthropic `service_tier` (`auto` versus `standard_only`)
- Voorkeursconfiguratie voor Claude CLI houdt de modelverwijzing canoniek en selecteert de CLI-
  backend apart: `anthropic/claude-opus-4-8` met
  modelgebonden `agentRuntime.id: "claude-cli"`. Verouderde
  `claude-cli/claude-opus-4-7`-verwijzingen blijven werken voor compatibiliteit.

<Note>
Anthropic-medewerkers hebben ons verteld dat OpenClaw-stijl Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en `claude -p`-gebruik als toegestaan voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Anthropic setup-token blijft beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Auth: OAuth (ChatGPT)
- Verouderde OpenAI Codex-modelverwijzing: `openai/gpt-5.5`
- Native Codex-app-server-harnasverwijzing: `openai/gpt-5.5`
- Documentatie voor het native Codex-app-server-harnas: [Codex-harnas](/nl/plugins/codex-harness)
- Verouderde modelverwijzingen: `codex/gpt-*`
- Plugin-grens: `openai/*` laadt de OpenAI-Plugin; de native Codex-app-server-Plugin wordt geselecteerd door de Codex-harnasruntime.
- CLI: `openclaw onboard --auth-choice openai` of `openclaw models auth login --provider openai`
- Standaardtransport is `auto` (eerst WebSocket, SSE als fallback)
- Overschrijf per OpenAI Codex-model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- `params.serviceTier` wordt ook doorgestuurd bij native Codex Responses-requests (`chatgpt.com/backend-api`)
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) worden alleen toegevoegd aan native Codex-verkeer naar `chatgpt.com/backend-api`, niet aan generieke OpenAI-compatibele proxy's
- Deelt dezelfde `/fast`-schakelaar en `params.fastMode`-configuratie als direct `openai/*`; OpenClaw mapt dat naar `service_tier=priority`
- `openai/gpt-5.5` gebruikt de native Codex-catalogus `contextWindow = 400000` en standaardruntime `contextTokens = 272000`; overschrijf de runtime-limiet met `models.providers.openai.models[].contextTokens`
- Beleidsopmerking: OpenAI Codex OAuth wordt expliciet ondersteund voor externe tools/workflows zoals OpenClaw.
- Voor de gebruikelijke abonnementsroute plus native Codex-runtime meld je je aan met `openai`-auth en configureer je `openai/gpt-5.5`; OpenAI-agentbeurten selecteren standaard Codex.
- Gebruik provider-/model-`agentRuntime.id: "openclaw"` alleen wanneer je de ingebouwde OpenClaw-route wilt; houd anders `openai/gpt-5.5` op het standaard Codex-harnas.
- Verouderde Codex GPT-verwijzingen zijn verouderde staat, geen live providerroute. Gebruik `openai/gpt-5.5` op de native Codex-runtime voor nieuwe agentconfiguratie, en voer `openclaw doctor --fix` uit om oude verouderde Codex-modelverwijzingen te migreren naar canonieke `openai/*`-verwijzingen.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Andere gehoste opties in abonnementsstijl

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/nl/providers/zai">
    Z.AI Coding Plan of algemene API-eindpunten.
  </Card>
  <Card title="MiniMax" href="/nl/providers/minimax">
    MiniMax Coding Plan OAuth of toegang via API-sleutel.
  </Card>
  <Card title="Qwen Cloud" href="/nl/providers/qwen">
    Qwen Cloud-provideroppervlak plus endpoint-mapping voor Alibaba DashScope en Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`)
- Zen-runtimeprovider: `opencode`
- Go-runtimeprovider: `opencode-go`
- Voorbeeldmodellen: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` of `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-sleutel)

- Provider: `google`
- Authenticatie: `GEMINI_API_KEY`
- Optionele rotatie: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`-fallback en `OPENCLAW_LIVE_GEMINI_KEY` (enkele override)
- Voorbeeldmodellen: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibiliteit: verouderde OpenClaw-configuratie die `google/gemini-3.1-flash-preview` gebruikt, wordt genormaliseerd naar `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` wordt geaccepteerd en genormaliseerd naar Google's live Gemini API-ID, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denken: `/think adaptive` gebruikt dynamisch denken van Google. Gemini 3/3.1 laten een vaste `thinkingLevel` weg; Gemini 2.5 verzendt `thinkingBudget: -1`.
- Directe Gemini-runs accepteren ook `agents.defaults.models["google/<model>"].params.cachedContent` (of verouderd `cached_content`) om een provider-native `cachedContents/...`-handle door te geven; Gemini-cachehits verschijnen als OpenClaw `cacheRead`

### Google Vertex en Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- Authenticatie: Vertex gebruikt gcloud ADC; Gemini CLI gebruikt zijn OAuth-flow

<Warning>
Gemini CLI OAuth in OpenClaw is een onofficiële integratie. Sommige gebruikers hebben Google-accountbeperkingen gemeld na gebruik van clients van derden. Lees de voorwaarden van Google en gebruik een niet-kritiek account als je ervoor kiest door te gaan.
</Warning>

Gemini CLI OAuth wordt meegeleverd als onderdeel van de gebundelde `google`-Plugin.

<Steps>
  <Step title="Install Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Standaardmodel: `google-gemini-cli/gemini-3-flash-preview`. Je plakt **geen** client-ID of geheim in `openclaw.json`. De CLI-loginflow slaat tokens op in authenticatieprofielen op de Gateway-host.

  </Step>
  <Step title="Set project (if needed)">
    Als verzoeken na het inloggen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host.
  </Step>
</Steps>

Gemini CLI gebruikt standaard `stream-json`. OpenClaw leest streamberichten van de assistent
en normaliseert `stats.cached` naar `cacheRead`; verouderde
`--output-format json`-overrides lezen antwoordtekst nog steeds uit `response`.

### Z.AI (GLM)

- Provider: `zai`
- Authenticatie: `ZAI_API_KEY`
- Voorbeeldmodel: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Modelverwijzingen gebruiken de canonieke `zai/*`-provider-ID.
  - `zai-api-key` detecteert automatisch het bijbehorende Z.AI-eindpunt; `zai-coding-global`, `zai-coding-cn`, `zai-global` en `zai-cn` dwingen een specifiek oppervlak af

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Authenticatie: `AI_GATEWAY_API_KEY`
- Voorbeeldmodellen: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Andere gebundelde provider-Plugins

| Provider                                | ID                               | Authenticatie-env                                     | Voorbeeldmodel                                             |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` of `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/nl/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth of `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/nl/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth of `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Bijzonderheden die handig zijn om te weten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Past zijn app-attributieheaders en Anthropic `cache_control`-markeringen alleen toe op geverifieerde `openrouter.ai`-routes. DeepSeek-, Moonshot- en ZAI-verwijzingen komen in aanmerking voor cache-TTL voor door OpenRouter beheerde promptcaching, maar ontvangen geen Anthropic-cachemarkeringen. Als proxy-achtige OpenAI-compatibele route slaat deze native-OpenAI-only-vormgeving over (`serviceTier`, Responses `store`, prompt-cache-hints, OpenAI reasoning-compat). Door Gemini ondersteunde verwijzingen behouden alleen proxy-Gemini-sanitatie van denksignaturen.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Door Gemini ondersteunde verwijzingen volgen hetzelfde proxy-Gemini-sanitatiepad; `kilocode/kilo/auto` en andere verwijzingen zonder ondersteuning voor proxy-redeneren slaan injectie van proxy-redeneren over.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding met API-sleutel schrijft expliciete M3- en M2.7-chatmodeldefinities; beeldbegrip blijft op de Plugin-eigen `MiniMax-VL-01`-mediaprovider.
  </Accordion>
  <Accordion title="NVIDIA">
    Model-ID's gebruiken een `nvidia/<vendor>/<model>`-naamruimte (bijvoorbeeld `nvidia/nvidia/nemotron-...` naast `nvidia/moonshotai/kimi-k2.5`); keuzelijsten behouden de letterlijke `<provider>/<model-id>`-samenstelling, terwijl de canonieke sleutel die naar de API wordt verzonden enkelvoudig geprefixt blijft.
  </Accordion>
  <Accordion title="xAI">
    Gebruikt het xAI Responses-pad. Het aanbevolen pad is SuperGrok/X Premium OAuth; API-sleutels werken nog steeds via `XAI_API_KEY` of Plugin-configuratie, en Grok `web_search` hergebruikt hetzelfde authenticatieprofiel voordat op API-sleutel wordt teruggevallen. `grok-4.3` is het gebundelde standaardchatmodel en `grok-build-0.1` kan worden geselecteerd voor bouw-/codegericht werk. `/fast` of `params.fastMode: true` herschrijft `grok-3`, `grok-3-mini`, `grok-4` en `grok-4-0709` naar hun `*-fast`-varianten. `tool_stream` staat standaard aan; schakel uit via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Providers via `models.providers` (aangepaste/basis-URL)

Gebruik `models.providers` (of `models.json`) om **aangepaste** providers of OpenAI/Anthropic-compatibele proxy's toe te voegen.

Veel van de gebundelde provider-Plugins hieronder publiceren al een standaardcatalogus. Gebruik expliciete `models.providers.<id>`-items alleen wanneer je de standaard-basis-URL, headers of modellenlijst wilt overschrijven.

Gateway-modelcapaciteitscontroles lezen ook expliciete `models.providers.<id>.models[]`-metadata. Als een aangepast of proxymodel afbeeldingen accepteert, stel dan `input: ["text", "image"]` in op dat model zodat WebChat en bijlagepaden met Node-oorsprong afbeeldingen doorgeven als native modelinvoer in plaats van mediarefs voor alleen tekst.

`agents.defaults.models["provider/model"]` regelt alleen modelzichtbaarheid, aliassen en metadata per model voor agents. Het registreert op zichzelf geen nieuw runtimemodel. Voeg voor aangepaste providermodellen ook `models.providers.<provider>.models[]` toe met ten minste de overeenkomende `id`.

### Moonshot AI (Kimi)

Installeer `@openclaw/moonshot-provider` voordat je onboardt. Voeg alleen een expliciete `models.providers.moonshot`-vermelding toe wanneer je de basis-URL of modelmetadata moet overschrijven:

- Provider: `moonshot`
- Authenticatie: `MOONSHOT_API_KEY`
- Voorbeeldmodel: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` of `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2-model-ID's:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi-coderen

Kimi Coding gebruikt het Anthropic-compatibele endpoint van Moonshot AI:

- Provider: `kimi`
- Authenticatie: `KIMI_API_KEY`
- Voorbeeldmodel: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Verouderde `kimi/kimi-code` en `kimi/k2p5` blijven geaccepteerd als compatibele model-ID's en worden genormaliseerd naar Kimi's stabiele API-model-ID.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) biedt toegang tot Doubao en andere modellen in China.

- Provider: `volcengine` (coderen: `volcengine-plan`)
- Authenticatie: `VOLCANO_ENGINE_API_KEY`
- Voorbeeldmodel: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding gebruikt standaard de codeerinterface, maar de algemene `volcengine/*`-catalogus wordt tegelijk geregistreerd.

In modelkiezers voor onboarding/configuratie geeft de Volcengine-authenticatiekeuze de voorkeur aan zowel `volcengine/*`- als `volcengine-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gebonden kiezer te tonen.

<Tabs>
  <Tab title="Standaardmodellen">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Codeermodellen (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Internationaal)

BytePlus ARK biedt internationale gebruikers toegang tot dezelfde modellen als Volcano Engine.

- Provider: `byteplus` (coderen: `byteplus-plan`)
- Authenticatie: `BYTEPLUS_API_KEY`
- Voorbeeldmodel: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding gebruikt standaard het codeeroppervlak, maar de algemene `byteplus/*`-catalogus wordt tegelijk geregistreerd.

In modelkiezers voor onboarding/configuratie geeft de BytePlus-authenticatiekeuze de voorkeur aan zowel `byteplus/*`- als `byteplus-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gebonden kiezer te tonen.

<Tabs>
  <Tab title="Standaardmodellen">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Codeermodellen (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic biedt Anthropic-compatibele modellen achter de `synthetic`-provider:

- Provider: `synthetic`
- Authenticatie: `SYNTHETIC_API_KEY`
- Voorbeeldmodel: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax wordt geconfigureerd via `models.providers`, omdat het aangepaste endpoints gebruikt:

- MiniMax OAuth (wereldwijd): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax-API-sleutel (wereldwijd): `--auth-choice minimax-global-api`
- MiniMax-API-sleutel (CN): `--auth-choice minimax-cn-api`
- Authenticatie: `MINIMAX_API_KEY` voor `minimax`; `MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` voor `minimax-portal`

Zie [/providers/minimax](/nl/providers/minimax) voor installatiedetails, modelopties en configuratiefragmenten.

<Note>
Op het Anthropic-compatibele streamingpad van MiniMax schakelt OpenClaw denken standaard uit voor de M2.x-familie, tenzij je dit expliciet instelt; MiniMax-M3 (en M3.x) blijft standaard op het weggelaten/adaptieve denkpad van de provider. `/fast on` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
</Note>

Door de Plugin beheerde splitsing van mogelijkheden:

- Standaardinstellingen voor tekst/chat blijven op `minimax/MiniMax-M3`
- Afbeeldingsgeneratie is `minimax/image-01` of `minimax-portal/image-01`
- Afbeeldingsbegrip is de door de Plugin beheerde `MiniMax-VL-01` op beide MiniMax-authenticatiepaden
- Webzoekopdrachten blijven op provider-id `minimax`

### LM Studio

LM Studio wordt geleverd als een gebundelde provider-Plugin die de native API gebruikt:

- Provider: `lmstudio`
- Authenticatie: `LM_API_TOKEN`
- Standaard basis-URL voor inferentie: `http://localhost:1234/v1`

Stel daarna een model in (vervang dit door een van de ID's die door `http://localhost:1234/api/v1/models` worden geretourneerd):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw gebruikt standaard de native `/api/v1/models` en `/api/v1/models/load` van LM Studio voor ontdekking en automatisch laden, met `/v1/chat/completions` voor inferentie. Als je wilt dat JIT-laden, TTL en automatisch verwijderen van LM Studio de levenscyclus van modellen beheren, stel dan `models.providers.lmstudio.params.preload: false` in. Zie [/providers/lmstudio](/nl/providers/lmstudio) voor installatie en probleemoplossing.

### Ollama

Ollama wordt geleverd als een gebundelde provider-Plugin en gebruikt de native API van Ollama:

- Provider: `ollama`
- Authenticatie: niet vereist (lokale server)
- Voorbeeldmodel: `ollama/llama3.3`
- Installatie: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wordt lokaal gedetecteerd op `http://127.0.0.1:11434` wanneer je je aanmeldt met `OLLAMA_API_KEY`, en de gebundelde provider-Plugin voegt Ollama rechtstreeks toe aan `openclaw onboard` en de modelkiezer. Zie [/providers/ollama](/nl/providers/ollama) voor onboarding, cloud-/lokale modus en aangepaste configuratie.

### vLLM

vLLM wordt geleverd als een gebundelde provider-Plugin voor lokale/zelfgehoste OpenAI-compatibele servers:

- Provider: `vllm`
- Authenticatie: optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:8000/v1`

Om lokaal automatische ontdekking in te schakelen (elke waarde werkt als je server geen authenticatie afdwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Stel daarna een model in (vervang dit door een van de ID's die door `/v1/models` worden geretourneerd):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Zie [/providers/vllm](/nl/providers/vllm) voor details.

### SGLang

SGLang wordt geleverd als een gebundelde provider-Plugin voor snelle zelfgehoste OpenAI-compatibele servers:

- Provider: `sglang`
- Authenticatie: optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:30000/v1`

Om lokaal automatische ontdekking in te schakelen (elke waarde werkt als je server geen authenticatie afdwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Stel daarna een model in (vervang dit door een van de ID's die door `/v1/models` worden geretourneerd):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Zie [/providers/sglang](/nl/providers/sglang) voor details.

### Lokale proxy's (LM Studio, vLLM, LiteLLM, enz.)

Voorbeeld (OpenAI-compatibel):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Standaard optionele velden">
    Voor aangepaste providers zijn `reasoning`, `input`, `cost`, `contextWindow` en `maxTokens` optioneel. Wanneer ze worden weggelaten, gebruikt OpenClaw standaard:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Aanbevolen: stel expliciete waarden in die overeenkomen met de limieten van je proxy/model.

  </Accordion>
  <Accordion title="Regels voor proxyrouteringsvormgeving">
    - Voor `api: "openai-completions"` op niet-native endpoints (elke niet-lege `baseUrl` waarvan de host niet `api.openai.com` is), dwingt OpenClaw `compat.supportsDeveloperRole: false` af om provider-400-fouten voor niet-ondersteunde `developer`-rollen te voorkomen.
    - Proxy-achtige OpenAI-compatibele routes slaan ook native OpenAI-specifieke aanvraagvormgeving over: geen `service_tier`, geen Responses `store`, geen Completions `store`, geen prompt-cache-hints, geen OpenAI reasoning-compat-payloadvormgeving en geen verborgen OpenClaw-attributieheaders.
    - Voor OpenAI-compatibele Completions-proxy's die leverancier-specifieke velden nodig hebben, stel je `agents.defaults.models["provider/model"].params.extra_body` (of `extraBody`) in om extra JSON in de uitgaande aanvraagbody samen te voegen.
    - Voor vLLM-chat-templatebesturing stel je `agents.defaults.models["provider/model"].params.chat_template_kwargs` in. De gebundelde vLLM-Plugin verzendt automatisch `enable_thinking: false` en `force_nonempty_content: true` voor `vllm/nemotron-3-*` wanneer het denkniveau van de sessie uit staat.
    - Voor trage lokale modellen of externe LAN-/tailnet-hosts stel je `models.providers.<id>.timeoutSeconds` in. Dit verlengt de HTTP-aanvraagafhandeling voor providermodellen, inclusief verbinding, headers, body-streaming en de totale guarded-fetch-afbreking, zonder de timeout van de volledige agentruntime te verhogen. Als `agents.defaults.timeoutSeconds` of een runspecifieke timeout lager is, verhoog die bovengrens dan ook; provider-timeouts kunnen de volledige run niet verlengen.
    - HTTP-aanroepen van modelproviders staan Surge-, Clash- en sing-box-fake-IP-DNS-antwoorden toe in `198.18.0.0/15` en `fc00::/7`, alleen voor de geconfigureerde provider-`baseUrl`-hostnaam. Aangepaste/lokale providerendpoints vertrouwen ook die exact geconfigureerde `scheme://host:port`-origin voor bewaakte modelaanvragen, inclusief loopback-, LAN- en tailnet-hosts. Dit is geen nieuwe configuratieoptie; de `baseUrl` die je configureert, breidt het aanvraagbeleid alleen voor die origin uit. Toestaan van fake-IP-hostnamen en exact-origin-vertrouwen zijn onafhankelijke mechanismen. Andere privé-, loopback-, link-local-, metadata-bestemmingen en andere poorten vereisen nog steeds een expliciete opt-in met `models.providers.<id>.request.allowPrivateNetwork: true`. Stel `models.providers.<id>.request.allowPrivateNetwork: false` in om je af te melden voor het exact-origin-vertrouwen.
    - Als `baseUrl` leeg is of wordt weggelaten, behoudt OpenClaw het standaard OpenAI-gedrag (dat naar `api.openai.com` resolveert).
    - Om veiligheidsredenen wordt een expliciete `compat.supportsDeveloperRole: true` nog steeds overschreven op niet-native `openai-completions`-endpoints.
    - Voor `api: "anthropic-messages"` op niet-directe endpoints (elke provider behalve de canonieke `anthropic`, of een aangepaste `models.providers.anthropic.baseUrl` waarvan de host geen openbaar `api.anthropic.com`-endpoint is), onderdrukt OpenClaw impliciete Anthropic-betaheaders zoals `claude-code-20250219`, `interleaved-thinking-2025-05-14` en OAuth-markeringen, zodat aangepaste Anthropic-compatibele proxy's niet worden afgewezen vanwege niet-ondersteunde betavlaggen. Stel `models.providers.<id>.headers["anthropic-beta"]` expliciet in als je proxy specifieke betafuncties nodig heeft.

  </Accordion>
</AccordionGroup>

## CLI-voorbeelden

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zie ook: [Configuratie](/nl/gateway/configuration) voor volledige configuratievoorbeelden.

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) - modelconfiguratiesleutels
- [Modelfailover](/nl/concepts/model-failover) - fallbackketens en opnieuw-proberen-gedrag
- [Modellen](/nl/concepts/models) - modelconfiguratie en aliassen
- [Providers](/nl/providers) - installatiegidsen per provider
