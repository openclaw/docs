---
read_when:
    - Je hebt een naslagwerk voor modelconfiguratie per aanbieder nodig
    - Je wilt voorbeeldconfiguraties of CLI-introductiecommando's voor modelproviders
sidebarTitle: Model providers
summary: Overzicht van modelproviders met voorbeeldconfiguraties + CLI-flows
title: Modelproviders
x-i18n:
    generated_at: "2026-05-02T11:14:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02494bfb71c0e0449eacd9ec028316e7a1479e51c6591aea5885baf3941272d5
    source_path: concepts/model-providers.md
    workflow: 16
---

Referentie voor **LLM-/modelproviders** (niet chatkanalen zoals WhatsApp/Telegram). Zie [Modellen](/nl/concepts/models) voor regels voor modelselectie.

## Snelle regels

<AccordionGroup>
  <Accordion title="Modelrefs en CLI-helpers">
    - Modelrefs gebruiken `provider/model` (voorbeeld: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` werkt als allowlist wanneer dit is ingesteld.
    - CLI-helpers: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` stellen standaardwaarden op providerniveau in; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` overschrijven deze per model.
    - Fallbackregels, cooldown-probes en persistentie van sessie-overschrijvingen: [Model-failover](/nl/concepts/model-failover).

  </Accordion>
  <Accordion title="Provider-auth toevoegen wijzigt je primaire model niet">
    `openclaw configure` behoudt een bestaande `agents.defaults.model.primary` wanneer je een provider toevoegt of opnieuw authenticeert. Provider-Plugins kunnen nog steeds een aanbevolen standaardmodel teruggeven in hun auth-configuratiepatch, maar configure behandelt dat als "maak dit model beschikbaar" wanneer er al een primair model bestaat, niet als "vervang het huidige primaire model."

    Gebruik `openclaw models set <provider/model>` of `openclaw models auth login --provider <id> --set-default` om bewust van standaardmodel te wisselen.

  </Accordion>
  <Accordion title="OpenAI provider/runtime-splitsing">
    Routes uit de OpenAI-familie zijn prefixspecifiek:

    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` gebruikt de native Codex app-server-harness. Dit is de gebruikelijke configuratie voor ChatGPT/Codex-abonnementen.
    - `openai-codex/<model>` gebruikt Codex OAuth in PI.
    - `openai/<model>` zonder Codex-runtime-overschrijving gebruikt de directe OpenAI API-sleutelprovider in PI.

    Zie [OpenAI](/nl/providers/openai) en [Codex-harness](/nl/plugins/codex-harness). Als de provider/runtime-splitsing verwarrend is, lees dan eerst [Agentruntimes](/nl/concepts/agent-runtimes).

    Automatisch inschakelen van Plugins volgt dezelfde grens: `openai-codex/<model>` hoort bij de OpenAI-Plugin, terwijl de Codex-Plugin wordt ingeschakeld door `agentRuntime.id: "codex"` of verouderde `codex/<model>`-refs.

    GPT-5.5 is beschikbaar via de native Codex app-server-harness wanneer `agentRuntime.id: "codex"` is ingesteld, via `openai-codex/gpt-5.5` in PI voor Codex OAuth, en via `openai/gpt-5.5` in PI voor direct API-sleutelverkeer wanneer je account dit beschikbaar stelt.

  </Accordion>
  <Accordion title="CLI-runtimes">
    CLI-runtimes gebruiken dezelfde splitsing: kies canonieke modelrefs zoals `anthropic/claude-*`, `google/gemini-*` of `openai/gpt-*`, en stel vervolgens `agents.defaults.agentRuntime.id` in op `claude-cli`, `google-gemini-cli` of `codex-cli` wanneer je een lokale CLI-backend wilt.

    Verouderde `claude-cli/*`-, `google-gemini-cli/*`- en `codex-cli/*`-refs migreren terug naar canonieke providerrefs, waarbij de runtime apart wordt vastgelegd.

  </Accordion>
</AccordionGroup>

## Door Plugins beheerd providergedrag

De meeste providerspecifieke logica bevindt zich in provider-Plugins (`registerProvider(...)`), terwijl OpenClaw de generieke inferentielus behoudt. Plugins beheren onboarding, modelcatalogi, mapping van auth-omgevingsvariabelen, transport-/configuratienormalisatie, opschoning van toolschema's, failoverclassificatie, OAuth-verversing, gebruiksrapportage, denk-/redeneerprofielen en meer.

De volledige lijst met provider-SDK-hooks en voorbeelden van gebundelde Plugins staat in [Provider-Plugins](/nl/plugins/sdk-provider-plugins). Een provider die een volledig aangepaste request-executor nodig heeft, is een apart, dieper extensieoppervlak.

<Note>
Door providers beheerd runnergedrag leeft op expliciete providerhooks zoals replaybeleid, toolschema-normalisatie, streamwrapping en transport-/requesthelpers. De verouderde statische bag `ProviderPlugin.capabilities` is alleen voor compatibiliteit en wordt niet meer gelezen door gedeelde runnerlogica.
</Note>

## API-sleutelrotatie

<AccordionGroup>
  <Accordion title="Sleutelbronnen en prioriteit">
    Configureer meerdere sleutels via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele live-overschrijving, hoogste prioriteit)
    - `<PROVIDER>_API_KEYS` (komma- of puntkommalijst)
    - `<PROVIDER>_API_KEY` (primaire sleutel)
    - `<PROVIDER>_API_KEY_*` (genummerde lijst, bijv. `<PROVIDER>_API_KEY_1`)

    Voor Google-providers wordt `GOOGLE_API_KEY` ook opgenomen als fallback. De selectievolgorde van sleutels behoudt prioriteit en dedupliceert waarden.

  </Accordion>
  <Accordion title="Wanneer rotatie begint">
    - Requests worden alleen opnieuw geprobeerd met de volgende sleutel bij rate-limit-responses (bijvoorbeeld `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` of periodieke berichten over gebruikslimieten).
    - Fouten die geen rate-limit zijn, falen direct; er wordt geen sleutelrotatie geprobeerd.
    - Wanneer alle kandidaatsleutels falen, wordt de uiteindelijke fout uit de laatste poging teruggegeven.

  </Accordion>
</AccordionGroup>

## Ingebouwde providers (pi-ai-catalogus)

OpenClaw wordt geleverd met de pi‑ai-catalogus. Deze providers vereisen **geen** `models.providers`-configuratie; stel alleen auth in en kies een model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionele rotatie: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (enkele overschrijving)
- Voorbeeldmodellen: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifieer account-/modelbeschikbaarheid met `openclaw models list --provider openai` als een specifieke installatie of API-sleutel zich anders gedraagt.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standaardtransport is `auto` (eerst WebSocket, SSE als fallback)
- Overschrijf per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- OpenAI Responses WebSocket-warming-up staat standaard aan via `params.openaiWsWarmup` (`true`/`false`)
- OpenAI-prioriteitsverwerking kan worden ingeschakeld via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` en `params.fastMode` mappen directe `openai/*` Responses-requests naar `service_tier=priority` op `api.openai.com`
- Gebruik `params.serviceTier` wanneer je een expliciete tier wilt in plaats van de gedeelde `/fast`-toggle
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) gelden alleen voor native OpenAI-verkeer naar `api.openai.com`, niet voor generieke OpenAI-compatibele proxy's
- Native OpenAI-routes behouden ook Responses `store`, promptcache-hints en OpenAI reasoning-compat-payloadvorming; proxyroutes doen dat niet
- `openai/gpt-5.3-codex-spark` wordt bewust onderdrukt in OpenClaw omdat live OpenAI API-requests het weigeren en de huidige Codex-catalogus het niet beschikbaar stelt

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
- Directe publieke Anthropic-requests ondersteunen de gedeelde `/fast`-toggle en `params.fastMode`, inclusief API-sleutel- en OAuth-geauthenticeerd verkeer dat naar `api.anthropic.com` wordt verzonden; OpenClaw mapt dat naar Anthropic `service_tier` (`auto` versus `standard_only`)
- Voorkeursconfiguratie voor Claude CLI houdt de modelref canoniek en selecteert de CLI
  backend afzonderlijk: `anthropic/claude-opus-4-7` met
  `agents.defaults.agentRuntime.id: "claude-cli"`. Verouderde
  `claude-cli/claude-opus-4-7`-refs blijven werken voor compatibiliteit.

<Note>
Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Het Anthropic setup-token blijft beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI-modelref: `openai-codex/gpt-5.5`
- Native Codex app-server-harnessref: `openai/gpt-5.5` met `agents.defaults.agentRuntime.id: "codex"`
- Documentatie voor native Codex app-server-harness: [Codex-harness](/nl/plugins/codex-harness)
- Verouderde modelrefs: `codex/gpt-*`
- Plugin-grens: `openai-codex/*` laadt de OpenAI-Plugin; de native Codex app-server-Plugin wordt alleen geselecteerd door de Codex-harnessruntime of verouderde `codex/*`-refs.
- CLI: `openclaw onboard --auth-choice openai-codex` of `openclaw models auth login --provider openai-codex`
- Standaardtransport is `auto` (eerst WebSocket, SSE als fallback)
- Overschrijf per PI-model via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- `params.serviceTier` wordt ook doorgestuurd bij native Codex Responses-requests (`chatgpt.com/backend-api`)
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) worden alleen toegevoegd aan native Codex-verkeer naar `chatgpt.com/backend-api`, niet aan generieke OpenAI-compatibele proxy's
- Deelt dezelfde `/fast`-toggle en `params.fastMode`-configuratie als direct `openai/*`; OpenClaw mapt dat naar `service_tier=priority`
- `openai-codex/gpt-5.5` gebruikt de native Codex-catalogus `contextWindow = 400000` en standaardruntime `contextTokens = 272000`; overschrijf de runtime-limiet met `models.providers.openai-codex.models[].contextTokens`
- Beleidsopmerking: OpenAI Codex OAuth wordt expliciet ondersteund voor externe tools/workflows zoals OpenClaw.
- Voor de gebruikelijke route met abonnement plus native Codex-runtime: meld je aan met `openai-codex`-auth, maar configureer `openai/gpt-5.5` plus `agents.defaults.agentRuntime.id: "codex"`.
- Gebruik `openai-codex/gpt-5.5` alleen wanneer je de Codex OAuth-/abonnementsroute via PI wilt; gebruik `openai/gpt-5.5` zonder Codex-runtime-overschrijving wanneer je API-sleutelconfiguratie en lokale catalogus de publieke API-route beschikbaar stellen.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex", fallback: "none" },
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
    MiniMax Coding Plan OAuth of toegang met API-sleutel.
  </Card>
  <Card title="Qwen Cloud" href="/nl/providers/qwen">
    Qwen Cloud-provideroppervlak plus Alibaba DashScope- en Coding Plan-eindpuntmapping.
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
- Optionele rotatie: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, terugval naar `GOOGLE_API_KEY` en `OPENCLAW_LIVE_GEMINI_KEY` (enkele override)
- Voorbeeldmodellen: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibiliteit: legacy OpenClaw-configuratie met `google/gemini-3.1-flash-preview` wordt genormaliseerd naar `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` wordt geaccepteerd en genormaliseerd naar Googles live Gemini API-id, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` gebruikt Google dynamic thinking. Gemini 3/3.1 laten een vaste `thinkingLevel` weg; Gemini 2.5 verzendt `thinkingBudget: -1`.
- Directe Gemini-runs accepteren ook `agents.defaults.models["google/<model>"].params.cachedContent` (of legacy `cached_content`) om een provider-native `cachedContents/...`-handle door te sturen; Gemini-cachehits verschijnen als OpenClaw `cacheRead`

### Google Vertex en Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- Authenticatie: Vertex gebruikt gcloud ADC; Gemini CLI gebruikt zijn OAuth-flow

<Warning>
Gemini CLI OAuth in OpenClaw is een onofficiële integratie. Sommige gebruikers hebben Google-accountbeperkingen gemeld na gebruik van clients van derden. Bekijk de Google-voorwaarden en gebruik een niet-kritiek account als je ervoor kiest door te gaan.
</Warning>

Gemini CLI OAuth wordt meegeleverd als onderdeel van de gebundelde `google` Plugin.

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

    Standaardmodel: `google-gemini-cli/gemini-3-flash-preview`. Je plakt **geen** client-id of secret in `openclaw.json`. De CLI-inlogflow slaat tokens op in authenticatieprofielen op de gateway-host.

  </Step>
  <Step title="Project instellen (indien nodig)">
    Als verzoeken na het inloggen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de gateway-host.
  </Step>
</Steps>

Gemini CLI JSON-antwoorden worden geparsed uit `response`; gebruik valt terug op `stats`, waarbij `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Authenticatie: `ZAI_API_KEY`
- Voorbeeldmodel: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliassen: `z.ai/*` en `z-ai/*` worden genormaliseerd naar `zai/*`
  - `zai-api-key` detecteert automatisch het bijpassende Z.AI-endpoint; `zai-coding-global`, `zai-coding-cn`, `zai-global` en `zai-cn` forceren een specifieke surface

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Authenticatie: `AI_GATEWAY_API_KEY`
- Voorbeeldmodellen: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Authenticatie: `KILOCODE_API_KEY`
- Voorbeeldmodel: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- De statische terugvalcatalogus levert `kilocode/kilo/auto` mee; live detectie via `https://api.kilo.ai/api/gateway/models` kan de runtimecatalogus verder uitbreiden.
- De exacte upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway en is niet hard-coded in OpenClaw.

Zie [/providers/kilocode](/nl/providers/kilocode) voor instellingsdetails.

### Andere gebundelde provider-Plugins

| Provider                | Id                               | Authenticatie-env                                           | Voorbeeldmodel                                |
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
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Bijzonderheden die handig zijn om te weten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Past zijn app-attributieheaders en Anthropic `cache_control`-markeringen alleen toe op geverifieerde `openrouter.ai`-routes. DeepSeek-, Moonshot- en ZAI-refs komen in aanmerking voor cache-TTL bij door OpenRouter beheerde promptcaching, maar ontvangen geen Anthropic-cachemarkeringen. Als proxy-achtige OpenAI-compatibele route slaat deze native-OpenAI-only vormgeving over (`serviceTier`, Responses `store`, promptcache-hints, OpenAI reasoning-compat). Gemini-backed refs behouden alleen proxy-Gemini thought-signature-sanering.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-backed refs volgen hetzelfde proxy-Gemini-saneringspad; `kilocode/kilo/auto` en andere refs zonder proxy-reasoning-ondersteuning slaan proxy-reasoning-injectie over.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding met API-sleutel schrijft expliciete tekst-only M2.7-chatmodeldefinities; beeldbegrip blijft op de Plugin-eigen mediaprovider `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Model-id's gebruiken een `nvidia/<vendor>/<model>`-naamruimte (bijvoorbeeld `nvidia/nvidia/nemotron-...` naast `nvidia/moonshotai/kimi-k2.5`); pickers behouden de letterlijke `<provider>/<model-id>`-samenstelling terwijl de canonieke sleutel die naar de API wordt verzonden enkelvoudig geprefixt blijft.
  </Accordion>
  <Accordion title="xAI">
    Gebruikt het xAI Responses-pad. `grok-4.3` is het gebundelde standaardchatmodel. `/fast` of `params.fastMode: true` herschrijft `grok-3`, `grok-3-mini`, `grok-4` en `grok-4-0709` naar hun `*-fast`-varianten. `tool_stream` staat standaard aan; schakel uit via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Wordt geleverd als de gebundelde `cerebras` provider-Plugin. GLM gebruikt `zai-glm-4.7`; de OpenAI-compatibele basis-URL is `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Providers via `models.providers` (aangepaste/basis-URL)

Gebruik `models.providers` (of `models.json`) om **aangepaste** providers of OpenAI/Anthropic‑compatibele proxy's toe te voegen.

Veel van de onderstaande gebundelde provider-Plugins publiceren al een standaardcatalogus. Gebruik expliciete `models.providers.<id>`-vermeldingen alleen wanneer je de standaardbasis-URL, headers of modellenlijst wilt overschrijven.

Gateway-modelcapaciteitscontroles lezen ook expliciete `models.providers.<id>.models[]`-metadata. Als een aangepast of proxymodel afbeeldingen accepteert, stel dan `input: ["text", "image"]` in op dat model, zodat WebChat en node-origin-bijlagepaden afbeeldingen doorgeven als native modelinvoer in plaats van tekst-only mediarefs.

### Moonshot AI (Kimi)

Moonshot wordt geleverd als een gebundelde provider-Plugin. Gebruik standaard de ingebouwde provider en voeg alleen een expliciete `models.providers.moonshot`-vermelding toe wanneer je de basis-URL of modelmetadata moet overschrijven:

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

### Kimi-coderen

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

Onboarding gebruikt standaard het codeeroppervlak, maar de algemene `volcengine/*`-catalogus wordt tegelijk geregistreerd.

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

### BytePlus (internationaal)

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
- MiniMax API-sleutel (wereldwijd): `--auth-choice minimax-global-api`
- MiniMax API-sleutel (CN): `--auth-choice minimax-cn-api`
- Authenticatie: `MINIMAX_API_KEY` voor `minimax`; `MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` voor `minimax-portal`

Zie [/providers/minimax](/nl/providers/minimax) voor installatiedetails, modelopties en configuratiefragmenten.

<Note>
Op MiniMax' Anthropic-compatibele streamingpad schakelt OpenClaw denken standaard uit, tenzij je dit expliciet instelt, en `/fast on` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
</Note>

Door Plugin beheerde capaciteitssplitsing:

- Tekst-/chatstandaarden blijven op `minimax/MiniMax-M2.7`
- Afbeeldingen genereren is `minimax/image-01` of `minimax-portal/image-01`
- Afbeeldingsbegrip is door de plugin beheerde `MiniMax-VL-01` op beide MiniMax-authenticatiepaden
- Webzoekopdrachten blijven op provider-id `minimax`

### LM Studio

LM Studio wordt geleverd als gebundelde provider-plugin die de native API gebruikt:

- Provider: `lmstudio`
- Authenticatie: `LM_API_TOKEN`
- Standaard basis-URL voor inferentie: `http://localhost:1234/v1`

Stel daarna een model in (vervang door een van de ID's die door `http://localhost:1234/api/v1/models` worden teruggegeven):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw gebruikt LM Studio's native `/api/v1/models` en `/api/v1/models/load` voor ontdekking en automatisch laden, met standaard `/v1/chat/completions` voor inferentie. Als je wilt dat LM Studio JIT-laden, TTL en automatisch verwijderen de modellevenscyclus beheren, stel dan `models.providers.lmstudio.params.preload: false` in. Zie [/providers/lmstudio](/nl/providers/lmstudio) voor installatie en probleemoplossing.

### Ollama

Ollama wordt geleverd als gebundelde provider-plugin en gebruikt Ollama's native API:

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

Ollama wordt lokaal gedetecteerd op `http://127.0.0.1:11434` wanneer je je aanmeldt met `OLLAMA_API_KEY`, en de gebundelde provider-plugin voegt Ollama rechtstreeks toe aan `openclaw onboard` en de modelkiezer. Zie [/providers/ollama](/nl/providers/ollama) voor onboarding, cloud-/lokale modus en aangepaste configuratie.

### vLLM

vLLM wordt geleverd als gebundelde provider-plugin voor lokale/zelfgehoste OpenAI-compatibele servers:

- Provider: `vllm`
- Authenticatie: optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:8000/v1`

Meld je aan voor lokale automatische ontdekking (elke waarde werkt als je server geen authenticatie afdwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Stel daarna een model in (vervang door een van de ID's die door `/v1/models` worden teruggegeven):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Zie [/providers/vllm](/nl/providers/vllm) voor details.

### SGLang

SGLang wordt geleverd als gebundelde provider-plugin voor snelle zelfgehoste OpenAI-compatibele servers:

- Provider: `sglang`
- Authenticatie: optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:30000/v1`

Meld je aan voor lokale automatische ontdekking (elke waarde werkt als je server geen authenticatie afdwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Stel daarna een model in (vervang door een van de ID's die door `/v1/models` worden teruggegeven):

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
  <Accordion title="Regels voor proxy-routevorming">
    - Voor `api: "openai-completions"` op niet-native endpoints (elke niet-lege `baseUrl` waarvan de host niet `api.openai.com` is) dwingt OpenClaw `compat.supportsDeveloperRole: false` af om provider-400-fouten voor niet-ondersteunde `developer`-rollen te voorkomen.
    - Proxy-achtige OpenAI-compatibele routes slaan ook native aanvraagvorming die alleen voor OpenAI geldt over: geen `service_tier`, geen Responses `store`, geen Completions `store`, geen promptcache-hints, geen OpenAI reasoning-compat-payloadvorming en geen verborgen OpenClaw-attributieheaders.
    - Stel voor OpenAI-compatibele Completions-proxy's die leveranciersspecifieke velden nodig hebben `agents.defaults.models["provider/model"].params.extra_body` (of `extraBody`) in om extra JSON samen te voegen in de uitgaande request-body.
    - Stel voor vLLM-chat-templatebesturing `agents.defaults.models["provider/model"].params.chat_template_kwargs` in. De gebundelde vLLM-plugin verzendt automatisch `enable_thinking: false` en `force_nonempty_content: true` voor `vllm/nemotron-3-*` wanneer het denkniveau van de sessie uit staat.
    - Stel voor trage lokale modellen of externe LAN-/tailnet-hosts `models.providers.<id>.timeoutSeconds` in. Dit breidt de HTTP-requestafhandeling van providermodellen uit, inclusief verbinden, headers, bodystreaming en de totale bewaakte-fetch-afbreking, zonder de hele agent-runtime-timeout te verhogen.
    - Als `baseUrl` leeg is of is weggelaten, behoudt OpenClaw het standaard OpenAI-gedrag (dat naar `api.openai.com` verwijst).
    - Voor veiligheid wordt een expliciete `compat.supportsDeveloperRole: true` nog steeds overschreven op niet-native `openai-completions`-endpoints.
    - Voor `api: "anthropic-messages"` op niet-directe endpoints (elke provider behalve de canonieke `anthropic`, of een aangepaste `models.providers.anthropic.baseUrl` waarvan de host geen openbaar `api.anthropic.com`-endpoint is) onderdrukt OpenClaw impliciete Anthropic-bètaheaders zoals `claude-code-20250219`, `interleaved-thinking-2025-05-14` en OAuth-markeringen, zodat aangepaste Anthropic-compatibele proxy's niet-ondersteunde bètaflags niet weigeren. Stel `models.providers.<id>.headers["anthropic-beta"]` expliciet in als je proxy specifieke bètafuncties nodig heeft.

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
- [Model-failover](/nl/concepts/model-failover) — fallbackketens en retrygedrag
- [Modellen](/nl/concepts/models) — modelconfiguratie en aliassen
- [Providers](/nl/providers) — installatiegidsen per provider
