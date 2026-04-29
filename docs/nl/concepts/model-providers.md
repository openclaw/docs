---
read_when:
    - Je hebt een referentie per provider nodig voor het instellen van modellen
    - Je wilt voorbeeldconfiguraties of CLI-onboardingcommando's voor modelproviders
sidebarTitle: Model providers
summary: Overzicht van modelproviders met voorbeeldconfiguraties + CLI-flows
title: Modelaanbieders
x-i18n:
    generated_at: "2026-04-29T22:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

Referentie voor **LLM-/modelproviders** (niet chatkanalen zoals WhatsApp/Telegram). Zie [Modellen](/nl/concepts/models) voor regels voor modelselectie.

## Snelle regels

<AccordionGroup>
  <Accordion title="Modelverwijzingen en CLI-helpers">
    - Modelverwijzingen gebruiken `provider/model` (voorbeeld: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` werkt als een allowlist wanneer dit is ingesteld.
    - CLI-helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` stellen standaardwaarden op providerniveau in; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` overschrijven die per model.
    - Fallbackregels, cooldown-probes en behoud van sessie-overschrijvingen: [Model-failover](/nl/concepts/model-failover).

  </Accordion>
  <Accordion title="Splitsing tussen OpenAI-provider en runtime">
    OpenAI-familieroutes zijn prefixspecifiek:

    - `openai/<model>` gebruikt de directe OpenAI API-key-provider in PI.
    - `openai-codex/<model>` gebruikt Codex OAuth in PI.
    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` gebruikt de native Codex app-server-harness.

    Zie [OpenAI](/nl/providers/openai) en [Codex-harness](/nl/plugins/codex-harness). Als de splitsing tussen provider en runtime verwarrend is, lees dan eerst [Agent-runtimes](/nl/concepts/agent-runtimes).

    Automatisch inschakelen van Plugins volgt dezelfde grens: `openai-codex/<model>` hoort bij de OpenAI Plugin, terwijl de Codex Plugin wordt ingeschakeld door `agentRuntime.id: "codex"` of legacy `codex/<model>`-verwijzingen.

    GPT-5.5 is beschikbaar via `openai/gpt-5.5` voor direct API-key-verkeer, `openai-codex/gpt-5.5` in PI voor Codex OAuth, en de native Codex app-server-harness wanneer `agentRuntime.id: "codex"` is ingesteld.

  </Accordion>
  <Accordion title="CLI-runtimes">
    CLI-runtimes gebruiken dezelfde splitsing: kies canonieke modelverwijzingen zoals `anthropic/claude-*`, `google/gemini-*` of `openai/gpt-*`, en stel daarna `agents.defaults.agentRuntime.id` in op `claude-cli`, `google-gemini-cli` of `codex-cli` wanneer je een lokale CLI-backend wilt.

    Legacy `claude-cli/*`, `google-gemini-cli/*` en `codex-cli/*`-verwijzingen migreren terug naar canonieke providerverwijzingen, waarbij de runtime apart wordt vastgelegd.

  </Accordion>
</AccordionGroup>

## Providergedrag in eigendom van Plugins

De meeste providerspecifieke logica leeft in provider-Plugins (`registerProvider(...)`), terwijl OpenClaw de generieke inferentielus behoudt. Plugins beheren onboarding, modelcatalogi, mapping van auth-env-vars, normalisatie van transport/configuratie, opschoning van tool-schema's, failoverclassificatie, OAuth-vernieuwing, gebruiksrapportage, denk-/redeneerprofielen en meer.

De volledige lijst met provider-SDK-hooks en voorbeelden van meegeleverde Plugins staat in [Provider-Plugins](/nl/plugins/sdk-provider-plugins). Een provider die een volledig aangepaste request-executor nodig heeft, is een afzonderlijk, dieper uitbreidingsoppervlak.

<Note>
Runnergedrag in eigendom van de provider leeft op expliciete providerhooks zoals replaybeleid, normalisatie van tool-schema's, stream-wrapping en transport-/requesthelpers. De legacy statische bag `ProviderPlugin.capabilities` is alleen voor compatibiliteit en wordt niet langer gelezen door gedeelde runnerlogica.
</Note>

## API-key-rotatie

<AccordionGroup>
  <Accordion title="Key-bronnen en prioriteit">
    Configureer meerdere keys via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele live-overschrijving, hoogste prioriteit)
    - `<PROVIDER>_API_KEYS` (lijst gescheiden door komma's of puntkomma's)
    - `<PROVIDER>_API_KEY` (primaire key)
    - `<PROVIDER>_API_KEY_*` (genummerde lijst, bijv. `<PROVIDER>_API_KEY_1`)

    Voor Google-providers wordt `GOOGLE_API_KEY` ook als fallback opgenomen. De selectievolgorde van keys behoudt de prioriteit en dedupliceert waarden.

  </Accordion>
  <Accordion title="Wanneer rotatie in werking treedt">
    - Requests worden alleen opnieuw geprobeerd met de volgende key bij rate-limit-antwoorden (bijvoorbeeld `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` of periodieke meldingen over gebruikslimieten).
    - Fouten die geen rate-limit zijn falen onmiddellijk; er wordt geen key-rotatie geprobeerd.
    - Wanneer alle kandidaatkeys falen, wordt de uiteindelijke fout teruggegeven van de laatste poging.

  </Accordion>
</AccordionGroup>

## Ingebouwde providers (pi-ai-catalogus)

OpenClaw wordt geleverd met de pi‑ai-catalogus. Deze providers vereisen **geen** `models.providers`-configuratie; stel alleen auth in en kies een model.

### OpenAI

- Provider: `openai`
- Authenticatie: `OPENAI_API_KEY`
- Optionele rotatie: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (enkele override)
- Voorbeeldmodellen: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Controleer account-/modelbeschikbaarheid met `openclaw models list --provider openai` als een specifieke installatie of API-sleutel zich anders gedraagt.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standaardtransport is `auto` (eerst WebSocket, SSE als fallback)
- Override per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- OpenAI Responses WebSocket-warm-up staat standaard aan via `params.openaiWsWarmup` (`true`/`false`)
- OpenAI-prioriteitsverwerking kan worden ingeschakeld via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` en `params.fastMode` koppelen directe `openai/*` Responses-verzoeken aan `service_tier=priority` op `api.openai.com`
- Gebruik `params.serviceTier` wanneer je een expliciete tier wilt in plaats van de gedeelde `/fast`-schakelaar
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) gelden alleen voor native OpenAI-verkeer naar `api.openai.com`, niet voor generieke OpenAI-compatibele proxies
- Native OpenAI-routes behouden ook Responses `store`, prompt-cachehints en OpenAI reasoning-compat payload-vormgeving; proxyroutes doen dat niet
- `openai/gpt-5.3-codex-spark` wordt bewust onderdrukt in OpenClaw omdat live OpenAI API-verzoeken het weigeren en de huidige Codex-catalogus het niet beschikbaar maakt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Authenticatie: `ANTHROPIC_API_KEY`
- Optionele rotatie: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (enkele override)
- Voorbeeldmodel: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Directe openbare Anthropic-verzoeken ondersteunen de gedeelde `/fast`-schakelaar en `params.fastMode`, inclusief verkeer met API-sleutel en OAuth-authenticatie dat naar `api.anthropic.com` wordt verzonden; OpenClaw koppelt dat aan Anthropic `service_tier` (`auto` versus `standard_only`)
- De aanbevolen Claude CLI-configuratie houdt de modelverwijzing canoniek en selecteert de CLI-backend afzonderlijk: `anthropic/claude-opus-4-7` met `agents.defaults.agentRuntime.id: "claude-cli"`. Verouderde `claude-cli/claude-opus-4-7`-verwijzingen blijven werken voor compatibiliteit.

<Note>
Anthropic-medewerkers hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Anthropic setup-token blijft beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Authenticatie: OAuth (ChatGPT)
- PI-modelverwijzing: `openai-codex/gpt-5.5`
- Native Codex app-server harness-verwijzing: `openai/gpt-5.5` met `agents.defaults.agentRuntime.id: "codex"`
- Native Codex app-server harness-documentatie: [Codex harness](/nl/plugins/codex-harness)
- Verouderde modelverwijzingen: `codex/gpt-*`
- Plugin-grens: `openai-codex/*` laadt de OpenAI-Plugin; de native Codex app-server Plugin wordt alleen geselecteerd door de Codex harness-runtime of verouderde `codex/*`-verwijzingen.
- CLI: `openclaw onboard --auth-choice openai-codex` of `openclaw models auth login --provider openai-codex`
- Standaardtransport is `auto` (eerst WebSocket, SSE als fallback)
- Override per PI-model via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- `params.serviceTier` wordt ook doorgestuurd bij native Codex Responses-verzoeken (`chatgpt.com/backend-api`)
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) worden alleen toegevoegd aan native Codex-verkeer naar `chatgpt.com/backend-api`, niet aan generieke OpenAI-compatibele proxies
- Deelt dezelfde `/fast`-schakelaar en `params.fastMode`-configuratie als direct `openai/*`; OpenClaw koppelt dat aan `service_tier=priority`
- `openai-codex/gpt-5.5` gebruikt de native Codex-cataloguswaarde `contextWindow = 400000` en standaard runtime `contextTokens = 272000`; override de runtimelimiet met `models.providers.openai-codex.models[].contextTokens`
- Beleidsnotitie: OpenAI Codex OAuth wordt expliciet ondersteund voor externe tools/workflows zoals OpenClaw.
- Gebruik `openai-codex/gpt-5.5` wanneer je de Codex OAuth-/abonnementsroute wilt; gebruik `openai/gpt-5.5` wanneer je API-sleutelconfiguratie en lokale catalogus de openbare API-route beschikbaar maken.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Andere gehoste opties in abonnementsstijl

<CardGroup cols={3}>
  <Card title="GLM-modellen" href="/nl/providers/glm">
    Z.AI Coding Plan of algemene API-eindpunten.
  </Card>
  <Card title="MiniMax" href="/nl/providers/minimax">
    MiniMax Coding Plan OAuth of toegang via API-sleutel.
  </Card>
  <Card title="Qwen Cloud" href="/nl/providers/qwen">
    Qwen Cloud-providersurface plus Alibaba DashScope en endpointmapping voor Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Authenticatie: `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`)
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
- Optionele rotatie: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` fallback en `OPENCLAW_LIVE_GEMINI_KEY` (enkele override)
- Voorbeeldmodellen: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibiliteit: verouderde OpenClaw-configuratie met `google/gemini-3.1-flash-preview` wordt genormaliseerd naar `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` wordt geaccepteerd en genormaliseerd naar de live Gemini API-id van Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denken: `/think adaptive` gebruikt dynamisch denken van Google. Gemini 3/3.1 laten een vaste `thinkingLevel` weg; Gemini 2.5 verstuurt `thinkingBudget: -1`.
- Directe Gemini-runs accepteren ook `agents.defaults.models["google/<model>"].params.cachedContent` (of verouderd `cached_content`) om een provider-native `cachedContents/...`-handle door te sturen; Gemini-cachehits verschijnen als OpenClaw `cacheRead`

### Google Vertex en Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- Authenticatie: Vertex gebruikt gcloud ADC; Gemini CLI gebruikt zijn OAuth-flow

<Warning>
Gemini CLI OAuth in OpenClaw is een onofficiële integratie. Sommige gebruikers hebben Google-accountbeperkingen gemeld na gebruik van clients van derden. Bekijk de voorwaarden van Google en gebruik een niet-kritiek account als je ervoor kiest door te gaan.
</Warning>

Gemini CLI OAuth wordt geleverd als onderdeel van de gebundelde `google`-Plugin.

<Steps>
  <Step title="Gemini CLI installeren">
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
  <Step title="Plugin inschakelen">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Inloggen">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Standaardmodel: `google-gemini-cli/gemini-3-flash-preview`. Je plakt **geen** client-ID of geheim in `openclaw.json`. De CLI-loginflow bewaart tokens in auth-profielen op de Gateway-host.

  </Step>
  <Step title="Set project (if needed)">
    Als aanvragen na het inloggen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host.
  </Step>
</Steps>

Gemini CLI JSON-antwoorden worden geparseerd uit `response`; gebruik valt terug op `stats`, waarbij `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Voorbeeldmodel: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliassen: `z.ai/*` en `z-ai/*` worden genormaliseerd naar `zai/*`
  - `zai-api-key` detecteert automatisch het overeenkomende Z.AI-eindpunt; `zai-coding-global`, `zai-coding-cn`, `zai-global` en `zai-cn` forceren een specifiek oppervlak

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Voorbeeldmodellen: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Voorbeeldmodel: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- De statische fallback-catalogus levert `kilocode/kilo/auto` mee; live-detectie via `https://api.kilo.ai/api/gateway/models` kan de runtime-catalogus verder uitbreiden.
- Exacte upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway, niet hardcoded in OpenClaw.

Zie [/providers/kilocode](/nl/providers/kilocode) voor installatiedetails.

### Andere gebundelde provider-plugins

| Provider                | ID                               | Auth-env                                                     | Voorbeeldmodel                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` of `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` of `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Nuttige eigenaardigheden

<AccordionGroup>
  <Accordion title="OpenRouter">
    Past zijn app-attributieheaders en Anthropic `cache_control`-markeringen alleen toe op geverifieerde `openrouter.ai`-routes. DeepSeek-, Moonshot- en ZAI-refs komen in aanmerking voor cache-TTL voor door OpenRouter beheerde promptcaching, maar ontvangen geen Anthropic-cachemarkeringen. Als proxy-achtige OpenAI-compatibele route slaat het native-OpenAI-only shaping over (`serviceTier`, Responses `store`, prompt-cache-hints, OpenAI reasoning-compat). Gemini-backed refs behouden alleen proxy-Gemini thought-signature-opschoning.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-backed refs volgen hetzelfde proxy-Gemini-opschoningspad; `kilocode/kilo/auto` en andere proxy-reasoning-niet-ondersteunde refs slaan proxy-reasoning-injectie over.
  </Accordion>
  <Accordion title="MiniMax">
    API-key-onboarding schrijft expliciete text-only M2.7-chatmodeldefinities; image understanding blijft op de plugin-eigen `MiniMax-VL-01`-mediaprovider.
  </Accordion>
  <Accordion title="NVIDIA">
    Model-ID's gebruiken een `nvidia/<vendor>/<model>`-namespace (bijvoorbeeld `nvidia/nvidia/nemotron-...` naast `nvidia/moonshotai/kimi-k2.5`); pickers behouden de letterlijke `<provider>/<model-id>`-samenstelling, terwijl de canonieke sleutel die naar de API wordt gestuurd single-prefixed blijft.
  </Accordion>
  <Accordion title="xAI">
    Gebruikt het xAI Responses-pad. `/fast` of `params.fastMode: true` herschrijft `grok-3`, `grok-3-mini`, `grok-4` en `grok-4-0709` naar hun `*-fast`-varianten. `tool_stream` staat standaard aan; schakel uit via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Wordt geleverd als de gebundelde `cerebras`-provider-plugin. GLM gebruikt `zai-glm-4.7`; de OpenAI-compatibele basis-URL is `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Providers via `models.providers` (aangepaste/basis-URL)

Gebruik `models.providers` (of `models.json`) om **aangepaste** providers of OpenAI/Anthropic-compatibele proxies toe te voegen.

Veel van de onderstaande gebundelde provider-plugins publiceren al een standaardcatalogus. Gebruik expliciete `models.providers.<id>`-vermeldingen alleen wanneer je de standaardbasis-URL, headers of modellenlijst wilt overschrijven.

Gateway-modelcapaciteitscontroles lezen ook expliciete metadata uit `models.providers.<id>.models[]`. Als een aangepast of proxymodel afbeeldingen accepteert, stel dan `input: ["text", "image"]` in op dat model, zodat WebChat- en node-origin-bijlagepaden afbeeldingen doorgeven als native modelinvoer in plaats van text-only media refs.

### Moonshot AI (Kimi)

Moonshot wordt geleverd als een gebundelde provider-plugin. Gebruik standaard de ingebouwde provider en voeg alleen een expliciete `models.providers.moonshot`-vermelding toe wanneer je de basis-URL of modelmetadata moet overschrijven:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Voorbeeldmodel: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` of `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2-model-ID's:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
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

Kimi Coding gebruikt Moonshot AI's Anthropic-compatibele eindpunt:

- Provider: `kimi`
- Authenticatie: `KIMI_API_KEY`
- Voorbeeldmodel: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Legacy `kimi/k2p5` blijft geaccepteerd als compatibiliteitsmodel-id.

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

Onboarding gebruikt standaard het coderingsoppervlak, maar de algemene `volcengine/*`-catalogus wordt tegelijkertijd geregistreerd.

In modelkiezers voor onboarding/configuratie geeft de Volcengine-authenticatiekeuze de voorkeur aan zowel `volcengine/*`- als `volcengine-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gescopeerde kiezer te tonen.

<Tabs>
  <Tab title="Standaardmodellen">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coderingsmodellen (volcengine-plan)">
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

Onboarding gebruikt standaard het coderingsoppervlak, maar de algemene `byteplus/*`-catalogus wordt tegelijkertijd geregistreerd.

In onboarding-/configuratiemodelkiezers geeft de BytePlus-authenticatiekeuze de voorkeur aan zowel `byteplus/*`- als `byteplus-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gebonden kiezer te tonen.

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

Synthetic biedt Anthropic-compatibele modellen achter de provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
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

MiniMax wordt geconfigureerd via `models.providers` omdat het aangepaste endpoints gebruikt:

- MiniMax OAuth (wereldwijd): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-sleutel (wereldwijd): `--auth-choice minimax-global-api`
- MiniMax API-sleutel (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` voor `minimax`; `MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` voor `minimax-portal`

Zie [/providers/minimax](/nl/providers/minimax) voor installatiedetails, modelopties en configuratiefragmenten.

<Note>
Op het Anthropic-compatibele streamingpad van MiniMax schakelt OpenClaw denken standaard uit, tenzij je het expliciet instelt, en `/fast on` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
</Note>

Door de Plugin beheerde capaciteitsopsplitsing:

- Standaardinstellingen voor tekst/chat blijven op `minimax/MiniMax-M2.7`
- Afbeeldingsgeneratie is `minimax/image-01` of `minimax-portal/image-01`
- Afbeeldingsbegrip is door de Plugin beheerde `MiniMax-VL-01` op beide MiniMax-authenticatiepaden
- Webzoekopdrachten blijven op provider-id `minimax`

### LM Studio

LM Studio wordt geleverd als een gebundelde provider-Plugin die de native API gebruikt:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standaard basis-URL voor inferentie: `http://localhost:1234/v1`

Stel daarna een model in (vervang dit door een van de ID's die door `http://localhost:1234/api/v1/models` worden geretourneerd):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw gebruikt de native `/api/v1/models` en `/api/v1/models/load` van LM Studio voor detectie en automatisch laden, met standaard `/v1/chat/completions` voor inferentie. Zie [/providers/lmstudio](/nl/providers/lmstudio) voor installatie en probleemoplossing.

### Ollama

Ollama wordt geleverd als een gebundelde provider-Plugin en gebruikt de native API van Ollama:

- Provider: `ollama`
- Auth: niet vereist (lokale server)
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

Ollama wordt lokaal gedetecteerd op `http://127.0.0.1:11434` wanneer je je hiervoor aanmeldt met `OLLAMA_API_KEY`, en de gebundelde provider-Plugin voegt Ollama rechtstreeks toe aan `openclaw onboard` en de modelkiezer. Zie [/providers/ollama](/nl/providers/ollama) voor onboarding, cloud-/lokale modus en aangepaste configuratie.

### vLLM

vLLM wordt geleverd als een gebundelde provider-Plugin voor lokale/zelfgehoste OpenAI-compatibele servers:

- Provider: `vllm`
- Auth: optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:8000/v1`

Om je lokaal aan te melden voor automatische detectie (elke waarde werkt als je server geen auth afdwingt):

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
- Auth: optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:30000/v1`

Om je lokaal aan te melden voor automatische detectie (elke waarde werkt als je server geen auth afdwingt):

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
  <Accordion title="Regels voor proxy-routevormgeving">
    - Voor `api: "openai-completions"` op niet-native endpoints (elke niet-lege `baseUrl` waarvan de host niet `api.openai.com` is) dwingt OpenClaw `compat.supportsDeveloperRole: false` af om provider-400-fouten voor niet-ondersteunde `developer`-rollen te voorkomen.
    - Proxy-achtige OpenAI-compatibele routes slaan ook native, alleen-OpenAI-verzoekvormgeving over: geen `service_tier`, geen Responses `store`, geen Completions `store`, geen promptcache-hints, geen OpenAI reasoning-compat payload-vormgeving en geen verborgen OpenClaw-attributieheaders.
    - Voor OpenAI-compatibele Completions-proxy's die leveranciersspecifieke velden nodig hebben, stel je `agents.defaults.models["provider/model"].params.extra_body` (of `extraBody`) in om extra JSON samen te voegen in de uitgaande request-body.
    - Voor vLLM-chattemplates stel je `agents.defaults.models["provider/model"].params.chat_template_kwargs` in. De gebundelde vLLM-Plugin verzendt automatisch `enable_thinking: false` en `force_nonempty_content: true` voor `vllm/nemotron-3-*` wanneer het denkniveau van de sessie uit staat.
    - Voor trage lokale modellen of externe LAN-/tailnet-hosts stel je `models.providers.<id>.timeoutSeconds` in. Dit verlengt de afhandeling van HTTP-verzoeken aan providermodellen, inclusief verbinden, headers, bodystreaming en de totale afbreking van guarded-fetch, zonder de volledige runtime-time-out van de agent te verhogen.
    - Als `baseUrl` leeg is of wordt weggelaten, behoudt OpenClaw het standaard OpenAI-gedrag (dat wordt omgezet naar `api.openai.com`).
    - Voor de veiligheid wordt een expliciete `compat.supportsDeveloperRole: true` nog steeds overschreven op niet-native `openai-completions`-endpoints.
    - Voor `api: "anthropic-messages"` op niet-directe endpoints (elke provider behalve de canonieke `anthropic`, of een aangepaste `models.providers.anthropic.baseUrl` waarvan de host geen openbaar `api.anthropic.com`-endpoint is) onderdrukt OpenClaw impliciete Anthropic-bètaheaders zoals `claude-code-20250219`, `interleaved-thinking-2025-05-14` en OAuth-markeringen, zodat aangepaste Anthropic-compatibele proxy's niet-ondersteunde bètavlaggen niet afwijzen. Stel `models.providers.<id>.headers["anthropic-beta"]` expliciet in als je proxy specifieke bètafuncties nodig heeft.

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

- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — modelconfiguratiesleutels
- [Modelfailover](/nl/concepts/model-failover) — fallbackketens en retry-gedrag
- [Modellen](/nl/concepts/models) — modelconfiguratie en aliassen
- [Providers](/nl/providers) — installatiespecifieke handleidingen per provider
