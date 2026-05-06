---
read_when:
    - Je hebt een referentie voor modelconfiguratie per aanbieder nodig
    - Je wilt voorbeeldconfiguraties of CLI-onboardingcommando's voor modelproviders
sidebarTitle: Model providers
summary: Overzicht van modelproviders met voorbeeldconfiguraties + CLI-flows
title: Modelproviders
x-i18n:
    generated_at: "2026-05-06T09:09:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

Referentie voor **LLM/modelproviders** (niet chatkanalen zoals WhatsApp/Telegram). Zie [Modellen](/nl/concepts/models) voor regels voor modelselectie.

## Snelle regels

<AccordionGroup>
  <Accordion title="Modelreferenties en CLI-helpers">
    - Modelreferenties gebruiken `provider/model` (voorbeeld: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` werkt als een allowlist wanneer ingesteld.
    - CLI-helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` stellen standaardwaarden op providerniveau in; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` overschrijven ze per model.
    - Fallbackregels, cooldown-probes en persistentie van sessie-overschrijvingen: [Model-failover](/nl/concepts/model-failover).

  </Accordion>
  <Accordion title="Provider-authenticatie toevoegen wijzigt je primaire model niet">
    `openclaw configure` behoudt een bestaande `agents.defaults.model.primary` wanneer je een provider toevoegt of opnieuw authenticeert. Provider-plugins kunnen nog steeds een aanbevolen standaardmodel teruggeven in hun auth-configpatch, maar configure behandelt dat als "maak dit model beschikbaar" wanneer er al een primair model bestaat, niet als "vervang het huidige primaire model."

    Gebruik `openclaw models set <provider/model>` of `openclaw models auth login --provider <id> --set-default` om bewust van standaardmodel te wisselen.

  </Accordion>
  <Accordion title="OpenAI provider/runtime-splitsing">
    OpenAI-family routes zijn prefixspecifiek:

    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` gebruikt de native Codex app-server harness. Dit is de gebruikelijke ChatGPT/Codex-abonnementsconfiguratie.
    - `openai-codex/<model>` gebruikt Codex OAuth in PI.
    - `openai/<model>` zonder een Codex runtime-overschrijving gebruikt de directe OpenAI API-key provider in PI.

    Zie [OpenAI](/nl/providers/openai) en [Codex harness](/nl/plugins/codex-harness). Als de provider/runtime-splitsing verwarrend is, lees dan eerst [Agent-runtimes](/nl/concepts/agent-runtimes).

    Automatisch inschakelen van plugins volgt dezelfde grens: `openai-codex/<model>` hoort bij de OpenAI-plugin, terwijl de Codex-plugin wordt ingeschakeld door `agentRuntime.id: "codex"` of legacy `codex/<model>`-referenties.

    GPT-5.5 is beschikbaar via de native Codex app-server harness wanneer `agentRuntime.id: "codex"` is ingesteld, via `openai-codex/gpt-5.5` in PI voor Codex OAuth, en via `openai/gpt-5.5` in PI voor direct API-key verkeer wanneer je account dit beschikbaar stelt.

  </Accordion>
  <Accordion title="CLI-runtimes">
    CLI-runtimes gebruiken dezelfde splitsing: kies canonieke modelreferenties zoals `anthropic/claude-*`, `google/gemini-*` of `openai/gpt-*`, en stel daarna `agents.defaults.agentRuntime.id` in op `claude-cli`, `google-gemini-cli` of `codex-cli` wanneer je een lokale CLI-backend wilt.

    Legacy `claude-cli/*`, `google-gemini-cli/*` en `codex-cli/*`-referenties worden terug gemigreerd naar canonieke providerreferenties, waarbij de runtime afzonderlijk wordt vastgelegd.

  </Accordion>
</AccordionGroup>

## Plugin-eigen providergedrag

De meeste providerspecifieke logica staat in provider-plugins (`registerProvider(...)`), terwijl OpenClaw de generieke inferentielus behoudt. Plugins zijn eigenaar van onboarding, modelcatalogi, auth env-var mapping, transport/config-normalisatie, tool-schema-opschoning, failover-classificatie, OAuth-verversing, gebruiksrapportage, thinking/reasoning-profielen en meer.

De volledige lijst met provider-SDK hooks en voorbeelden van meegeleverde plugins staat in [Provider-plugins](/nl/plugins/sdk-provider-plugins). Een provider die een volledig aangepaste request-executor nodig heeft, is een afzonderlijk, dieper uitbreidingsoppervlak.

<Note>
Provider-eigen runnergedrag staat op expliciete providerhooks zoals replaybeleid, tool-schema-normalisatie, streamwrapping en transport/request-helpers. De legacy statische tas `ProviderPlugin.capabilities` is alleen voor compatibiliteit en wordt niet meer gelezen door gedeelde runnerlogica.
</Note>

## API-key rotatie

<AccordionGroup>
  <Accordion title="Key-bronnen en prioriteit">
    Configureer meerdere keys via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele live-overschrijving, hoogste prioriteit)
    - `<PROVIDER>_API_KEYS` (lijst met komma's of puntkomma's)
    - `<PROVIDER>_API_KEY` (primaire key)
    - `<PROVIDER>_API_KEY_*` (genummerde lijst, bijv. `<PROVIDER>_API_KEY_1`)

    Voor Google-providers wordt `GOOGLE_API_KEY` ook opgenomen als fallback. De keyselectievolgorde behoudt prioriteit en dedupliceert waarden.

  </Accordion>
  <Accordion title="Wanneer rotatie start">
    - Requests worden alleen opnieuw geprobeerd met de volgende key bij rate-limit responses (bijvoorbeeld `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` of periodieke berichten over gebruikslimieten).
    - Niet-rate-limit fouten falen onmiddellijk; er wordt geen keyrotatie geprobeerd.
    - Wanneer alle kandidaatkeys falen, wordt de uiteindelijke fout van de laatste poging teruggegeven.

  </Accordion>
</AccordionGroup>

## Ingebouwde providers (pi-ai-catalogus)

OpenClaw wordt geleverd met de pi-ai-catalogus. Deze providers vereisen **geen** `models.providers`-config; stel alleen auth in en kies een model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionele rotatie: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (enkele overschrijving)
- Voorbeeldmodellen: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifieer account-/modelbeschikbaarheid met `openclaw models list --provider openai` als een specifieke installatie of API-key zich anders gedraagt.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standaardtransport is `auto` (WebSocket eerst, SSE als fallback)
- Overschrijf per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- OpenAI Responses WebSocket warm-up staat standaard aan via `params.openaiWsWarmup` (`true`/`false`)
- OpenAI-prioriteitsverwerking kan worden ingeschakeld via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` en `params.fastMode` mappen directe `openai/*` Responses-requests naar `service_tier=priority` op `api.openai.com`
- Gebruik `params.serviceTier` wanneer je een expliciete tier wilt in plaats van de gedeelde `/fast`-schakelaar
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) gelden alleen voor native OpenAI-verkeer naar `api.openai.com`, niet voor generieke OpenAI-compatibele proxies
- Native OpenAI-routes behouden ook Responses `store`, prompt-cache hints en OpenAI reasoning-compat payload-vormgeving; proxy-routes doen dat niet
- `openai/gpt-5.3-codex-spark` wordt bewust onderdrukt in OpenClaw omdat live OpenAI API-requests dit afwijzen en de huidige Codex-catalogus het niet beschikbaar stelt

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
- Directe publieke Anthropic-requests ondersteunen de gedeelde `/fast`-schakelaar en `params.fastMode`, inclusief API-key en OAuth-geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden; OpenClaw mapt dat naar Anthropic `service_tier` (`auto` versus `standard_only`)
- Aanbevolen Claude CLI-config houdt de modelreferentie canoniek en selecteert de CLI
  backend afzonderlijk: `anthropic/claude-opus-4-7` met
  `agents.defaults.agentRuntime.id: "claude-cli"`. Legacy
  `claude-cli/claude-opus-4-7`-referenties blijven werken voor compatibiliteit.

<Note>
Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Anthropic setup-token blijft beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan Claude CLI-hergebruik en `claude -p` wanneer beschikbaar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI-modelreferentie: `openai-codex/gpt-5.5`
- Native Codex app-server harness-referentie: `openai/gpt-5.5` met `agents.defaults.agentRuntime.id: "codex"`
- Native Codex app-server harness-docs: [Codex harness](/nl/plugins/codex-harness)
- Legacy modelreferenties: `codex/gpt-*`
- Plugin-grens: `openai-codex/*` laadt de OpenAI-plugin; de native Codex app-server plugin wordt alleen geselecteerd door de Codex harness-runtime of legacy `codex/*`-referenties.
- CLI: `openclaw onboard --auth-choice openai-codex` of `openclaw models auth login --provider openai-codex`
- Standaardtransport is `auto` (WebSocket eerst, SSE als fallback)
- Overschrijf per PI-model via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- `params.serviceTier` wordt ook doorgestuurd bij native Codex Responses-requests (`chatgpt.com/backend-api`)
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) worden alleen toegevoegd aan native Codex-verkeer naar `chatgpt.com/backend-api`, niet aan generieke OpenAI-compatibele proxies
- Deelt dezelfde `/fast`-schakelaar en `params.fastMode`-config als direct `openai/*`; OpenClaw mapt dat naar `service_tier=priority`
- `openai-codex/gpt-5.5` gebruikt de native Codex-catalogus `contextWindow = 400000` en standaardruntime `contextTokens = 272000`; overschrijf de runtimelimiet met `models.providers.openai-codex.models[].contextTokens`
- Beleidsnotitie: OpenAI Codex OAuth wordt expliciet ondersteund voor externe tools/workflows zoals OpenClaw.
- Voor de gebruikelijke abonnementsroute plus native Codex-runtime meld je je aan met `openai-codex` auth, maar configureer je `openai/gpt-5.5` plus `agents.defaults.agentRuntime.id: "codex"`.
- Gebruik `openai-codex/gpt-5.5` alleen wanneer je de Codex OAuth/abonnementsroute via PI wilt; gebruik `openai/gpt-5.5` zonder de Codex runtime-overschrijving wanneer je API-key setup en lokale catalogus de publieke API-route beschikbaar stellen.
- Oudere `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` en `openai-codex/gpt-5.3*`-referenties worden onderdrukt omdat ChatGPT/Codex OAuth-accounts ze afwijzen; gebruik in plaats daarvan `openai-codex/gpt-5.5` of de native Codex-runtime route.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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
    MiniMax Coding Plan OAuth of API-key toegang.
  </Card>
  <Card title="Qwen Cloud" href="/nl/providers/qwen">
    Qwen Cloud provideroppervlak plus endpoint-mapping voor Alibaba DashScope en Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (of `OPENCODE_ZEN_API_KEY`)
- Zen runtime-provider: `opencode`
- Go runtime-provider: `opencode-go`
- Voorbeeldmodellen: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` of `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-key)

- Aanbieder: `google`
- Authenticatie: `GEMINI_API_KEY`
- Optionele rotatie: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`-fallback en `OPENCLAW_LIVE_GEMINI_KEY` (enkele override)
- Voorbeeldmodellen: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibiliteit: verouderde OpenClaw-configuratie die `google/gemini-3.1-flash-preview` gebruikt, wordt genormaliseerd naar `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` wordt geaccepteerd en genormaliseerd naar Google's live Gemini API-id, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denken: `/think adaptive` gebruikt Google dynamisch denken. Gemini 3/3.1 laten een vaste `thinkingLevel` weg; Gemini 2.5 verzendt `thinkingBudget: -1`.
- Directe Gemini-uitvoeringen accepteren ook `agents.defaults.models["google/<model>"].params.cachedContent` (of verouderd `cached_content`) om een providernatieve `cachedContents/...`-handle door te geven; Gemini-cachehits verschijnen als OpenClaw `cacheRead`

### Google Vertex en Gemini CLI

- Aanbieders: `google-vertex`, `google-gemini-cli`
- Authenticatie: Vertex gebruikt gcloud ADC; Gemini CLI gebruikt zijn OAuth-flow

<Warning>
Gemini CLI OAuth in OpenClaw is een onofficiële integratie. Sommige gebruikers hebben Google-accountbeperkingen gemeld na het gebruik van clients van derden. Bekijk Google's voorwaarden en gebruik een niet-kritiek account als je ervoor kiest door te gaan.
</Warning>

Gemini CLI OAuth wordt meegeleverd als onderdeel van de gebundelde `google`-Plugin.

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

    Standaardmodel: `google-gemini-cli/gemini-3-flash-preview`. Je plakt **geen** client-id of geheim in `openclaw.json`. De CLI-loginflow slaat tokens op in authenticatieprofielen op de gatewayhost.

  </Step>
  <Step title="Project instellen (indien nodig)">
    Als aanvragen na het inloggen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de gatewayhost.
  </Step>
</Steps>

Gemini CLI JSON-antwoorden worden geparseerd uit `response`; gebruik valt terug op `stats`, waarbij `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.

### Z.AI (GLM)

- Aanbieder: `zai`
- Authenticatie: `ZAI_API_KEY`
- Voorbeeldmodel: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliassen: `z.ai/*` en `z-ai/*` worden genormaliseerd naar `zai/*`
  - `zai-api-key` detecteert automatisch het bijpassende Z.AI-eindpunt; `zai-coding-global`, `zai-coding-cn`, `zai-global` en `zai-cn` dwingen een specifiek oppervlak af

### Vercel AI Gateway

- Aanbieder: `vercel-ai-gateway`
- Authenticatie: `AI_GATEWAY_API_KEY`
- Voorbeeldmodellen: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Aanbieder: `kilocode`
- Authenticatie: `KILOCODE_API_KEY`
- Voorbeeldmodel: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- De statische fallbackcatalogus levert `kilocode/kilo/auto`; live `https://api.kilo.ai/api/gateway/models`-detectie kan de runtimecatalogus verder uitbreiden.
- Exacte upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway, niet hardgecodeerd in OpenClaw.

Zie [/providers/kilocode](/nl/providers/kilocode) voor installatiedetails.

### Andere gebundelde provider-Plugins

| Aanbieder               | Id                               | Authenticatie-env                                           | Voorbeeldmodel                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
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
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Bijzonderheden die goed zijn om te weten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Past zijn app-attributieheaders en Anthropic `cache_control`-markeringen alleen toe op geverifieerde `openrouter.ai`-routes. DeepSeek-, Moonshot- en ZAI-refs komen in aanmerking voor cache-TTL voor door OpenRouter beheerde promptcaching, maar ontvangen geen Anthropic-cachemarkeringen. Als proxy-achtige OpenAI-compatibele route slaat deze native-OpenAI-only-vormgeving over (`serviceTier`, Responses `store`, promptcache-hints, OpenAI reasoning-compat). Door Gemini ondersteunde refs behouden alleen proxy-Gemini-sanering van denksignaturen.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Door Gemini ondersteunde refs volgen hetzelfde proxy-Gemini-saneringspad; `kilocode/kilo/auto` en andere refs waarvoor proxy-reasoning niet wordt ondersteund, slaan proxy-reasoning-injectie over.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding met API-sleutel schrijft expliciete M2.7-chatmodeldefinities voor alleen tekst; beeldbegrip blijft op de door de Plugin beheerde `MiniMax-VL-01`-mediaprovider.
  </Accordion>
  <Accordion title="NVIDIA">
    Model-id's gebruiken een `nvidia/<vendor>/<model>`-namespace (bijvoorbeeld `nvidia/nvidia/nemotron-...` naast `nvidia/moonshotai/kimi-k2.5`); pickers behouden de letterlijke `<provider>/<model-id>`-samenstelling terwijl de canonieke sleutel die naar de API wordt gestuurd enkelvoudig geprefixt blijft.
  </Accordion>
  <Accordion title="xAI">
    Gebruikt het xAI Responses-pad. `grok-4.3` is het meegeleverde standaardchatmodel. `/fast` of `params.fastMode: true` herschrijft `grok-3`, `grok-3-mini`, `grok-4` en `grok-4-0709` naar hun `*-fast`-varianten. `tool_stream` staat standaard aan; schakel uit via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Wordt geleverd als de meegeleverde `cerebras`-provider-Plugin. GLM gebruikt `zai-glm-4.7`; de OpenAI-compatibele basis-URL is `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Providers via `models.providers` (aangepaste/basis-URL)

Gebruik `models.providers` (of `models.json`) om **aangepaste** providers of OpenAI/Anthropic-compatibele proxy's toe te voegen.

Veel van de meegeleverde provider-Plugins hieronder publiceren al een standaardcatalogus. Gebruik expliciete `models.providers.<id>`-vermeldingen alleen wanneer je de standaard basis-URL, headers of modellijst wilt overschrijven.

Gateway-modelcapaciteitscontroles lezen ook expliciete metadata uit `models.providers.<id>.models[]`. Als een aangepast of proxymodel afbeeldingen accepteert, stel dan `input: ["text", "image"]` in voor dat model, zodat WebChat en bijlagenpaden met node-oorsprong afbeeldingen doorgeven als native modelinputs in plaats van mediarefs voor alleen tekst.

### Moonshot AI (Kimi)

Moonshot wordt geleverd als een meegeleverde provider-Plugin. Gebruik standaard de ingebouwde provider en voeg alleen een expliciete `models.providers.moonshot`-vermelding toe wanneer je de basis-URL of modelmetadata moet overschrijven:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Voorbeeldmodel: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` of `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2-model-id's:

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

### Kimi-codering

Kimi Coding gebruikt het Anthropic-compatibele endpoint van Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
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

- Provider: `volcengine` (codering: `volcengine-plan`)
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

Onboarding gebruikt standaard het coderingsoppervlak, maar de algemene `volcengine/*`-catalogus wordt tegelijk geregistreerd.

In onboarding-/configure-modelkiezers geeft de Volcengine-authenticatiekeuze de voorkeur aan zowel `volcengine/*`- als `volcengine-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gescopeerde kiezer te tonen.

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

- Provider: `byteplus` (codering: `byteplus-plan`)
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

Onboarding gebruikt standaard het coderingsoppervlak, maar de algemene `byteplus/*`-catalogus wordt tegelijk geregistreerd.

In onboarding-/configure-modelkiezers geeft de BytePlus-authenticatiekeuze de voorkeur aan zowel `byteplus/*`- als `byteplus-plan/*`-rijen. Als die modellen nog niet zijn geladen, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gescopeerde kiezer te tonen.

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

MiniMax wordt geconfigureerd via `models.providers` omdat het aangepaste endpoints gebruikt:

- MiniMax OAuth (wereldwijd): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (wereldwijd): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Authenticatie: `MINIMAX_API_KEY` voor `minimax`; `MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` voor `minimax-portal`

Zie [/providers/minimax](/nl/providers/minimax) voor installatiedetails, modelopties en configuratiefragmenten.

<Note>
Op het Anthropic-compatibele streamingpad van MiniMax schakelt OpenClaw denken standaard uit tenzij je dit expliciet instelt, en `/fast on` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
</Note>

Plugin-eigen capability-splitsing:

- Standaardinstellingen voor tekst/chat blijven op `minimax/MiniMax-M2.7`
- Afbeeldingsgeneratie is `minimax/image-01` of `minimax-portal/image-01`
- Afbeeldingsbegrip is Plugin-eigen `MiniMax-VL-01` op beide MiniMax-authenticatiepaden
- Webzoeken blijft op provider-id `minimax`

### LM Studio

LM Studio wordt geleverd als een gebundelde provider-Plugin die de native API gebruikt:

- Provider: `lmstudio`
- Authenticatie: `LM_API_TOKEN`
- Standaard basis-URL voor inferentie: `http://localhost:1234/v1`

Stel daarna een model in (vervang door een van de id's die worden teruggegeven door `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw gebruikt LM Studio's native `/api/v1/models` en `/api/v1/models/load` voor ontdekking en automatisch laden, met standaard `/v1/chat/completions` voor inferentie. Als je wilt dat LM Studio JIT-laden, TTL en automatisch verwijderen de modellevenscyclus beheren, stel dan `models.providers.lmstudio.params.preload: false` in. Zie [/providers/lmstudio](/nl/providers/lmstudio) voor installatie en probleemoplossing.

### Ollama

Ollama wordt geleverd als een gebundelde provider-Plugin en gebruikt Ollama's native API:

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

Stel daarna een model in (vervang door een van de id's die worden teruggegeven door `/v1/models`):

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

Stel daarna een model in (vervang door een van de id's die worden teruggegeven door `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Zie [/providers/sglang](/nl/providers/sglang) voor details.

### Lokale proxies (LM Studio, vLLM, LiteLLM, enz.)

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
  <Accordion title="Regels voor proxyroute-vormgeving">
    - Voor `api: "openai-completions"` op niet-native endpoints (elke niet-lege `baseUrl` waarvan de host niet `api.openai.com` is), dwingt OpenClaw `compat.supportsDeveloperRole: false` af om provider-400-fouten voor niet-ondersteunde `developer`-rollen te voorkomen.
    - Proxy-achtige OpenAI-compatibele routes slaan ook native OpenAI-specifieke verzoekvormgeving over: geen `service_tier`, geen Responses `store`, geen Completions `store`, geen prompt-cache-hints, geen OpenAI reasoning-compat payload-vormgeving en geen verborgen OpenClaw-attributieheaders.
    - Voor OpenAI-compatibele Completions-proxies die leverancierspecifieke velden nodig hebben, stel je `agents.defaults.models["provider/model"].params.extra_body` (of `extraBody`) in om extra JSON samen te voegen in de uitgaande request body.
    - Voor vLLM chat-template-controls stel je `agents.defaults.models["provider/model"].params.chat_template_kwargs` in. De gebundelde vLLM-Plugin verzendt automatisch `enable_thinking: false` en `force_nonempty_content: true` voor `vllm/nemotron-3-*` wanneer het denkniveau van de sessie uit staat.
    - Stel voor trage lokale modellen of externe LAN-/tailnet-hosts `models.providers.<id>.timeoutSeconds` in. Dit verlengt de afhandeling van HTTP-verzoeken voor providermodellen, inclusief verbinden, headers, body-streaming en de totale guarded-fetch-afbreking, zonder de volledige runtime-time-out van de agent te verhogen.
    - HTTP-aanroepen van modelproviders staan Surge-, Clash- en sing-box-fake-IP-DNS-antwoorden in `198.18.0.0/15` en `fc00::/7` alleen toe voor de geconfigureerde provider-`baseUrl`-hostnaam. Andere private, loopback-, link-local- en metadata-bestemmingen vereisen nog steeds een expliciete opt-in met `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Als `baseUrl` leeg is of is weggelaten, behoudt OpenClaw het standaard OpenAI-gedrag (dat resolveert naar `api.openai.com`).
    - Voor veiligheid wordt een expliciete `compat.supportsDeveloperRole: true` nog steeds overschreven op niet-native `openai-completions`-endpoints.
    - Voor `api: "anthropic-messages"` op niet-directe endpoints (elke provider behalve de canonieke `anthropic`, of een aangepaste `models.providers.anthropic.baseUrl` waarvan de host geen openbaar `api.anthropic.com`-endpoint is), onderdrukt OpenClaw impliciete Anthropic beta-headers zoals `claude-code-20250219`, `interleaved-thinking-2025-05-14` en OAuth-markeringen, zodat aangepaste Anthropic-compatibele proxies niet-ondersteunde beta-flags niet afwijzen. Stel `models.providers.<id>.headers["anthropic-beta"]` expliciet in als je proxy specifieke beta-functies nodig heeft.

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
- [Modelfailover](/nl/concepts/model-failover) - fallbackketens en retry-gedrag
- [Modellen](/nl/concepts/models) - modelconfiguratie en aliassen
- [Providers](/nl/providers) - installatiegidsen per provider
