---
read_when:
    - Je hebt een referentie voor modelconfiguratie per provider nodig
    - Je wilt voorbeeldconfiguraties of CLI-onboardingcommando's voor modelproviders
sidebarTitle: Model providers
summary: Overzicht van modelproviders met voorbeeldconfiguraties + CLI-flows
title: Modelaanbieders
x-i18n:
    generated_at: "2026-05-11T20:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

Verwijzing voor **LLM-/modelproviders** (niet chatkanalen zoals WhatsApp/Telegram). Zie [Modellen](/nl/concepts/models) voor regels voor modelselectie.

## Snelle regels

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - Modelverwijzingen gebruiken `provider/model` (voorbeeld: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` fungeert als allowlist wanneer dit is ingesteld.
    - CLI-hulpprogramma's: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` stellen standaardwaarden op providerniveau in; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` overschrijven die per model.
    - Fallbackregels, cooldown-probes en persistentie van sessie-overschrijvingen: [Model-failover](/nl/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` behoudt een bestaande `agents.defaults.model.primary` wanneer je een provider toevoegt of opnieuw autoriseert. `openclaw models auth login` doet hetzelfde tenzij je `--set-default` meegeeft. Provider-plugins kunnen nog steeds een aanbevolen standaardmodel teruggeven in hun auth-configuratiepatch, maar OpenClaw behandelt dat als "maak dit model beschikbaar" wanneer er al een primair model bestaat, niet als "vervang het huidige primaire model."

    Gebruik `openclaw models set <provider/model>` of `openclaw models auth login --provider <id> --set-default` om bewust van standaardmodel te wisselen.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI-familieroutes zijn prefixspecifiek:

    - `openai/<model>` gebruikt standaard de native Codex app-server-harness voor agentbeurten. Dit is de gebruikelijke ChatGPT/Codex-abonnementsconfiguratie.
    - `openai-codex/<model>` is legacy-configuratie die doctor herschrijft naar `openai/<model>`.
    - `openai/<model>` plus provider-/model-`agentRuntime.id: "pi"` gebruikt PI voor expliciete API-sleutel- of compatibiliteitsroutes.

    Zie [OpenAI](/nl/providers/openai) en [Codex-harness](/nl/plugins/codex-harness). Als de splitsing tussen provider en runtime verwarrend is, lees dan eerst [Agentruntimes](/nl/concepts/agent-runtimes).

    Automatisch inschakelen van Plugins volgt dezelfde grens: `openai/*`-agentverwijzingen schakelen de Codex-plugin in voor de standaardroute, en expliciete provider-/model-`agentRuntime.id: "codex"`- of legacy-`codex/<model>`-verwijzingen vereisen die ook.

    GPT-5.5 is standaard beschikbaar via de native Codex app-server-harness op `openai/gpt-5.5`, en via PI alleen wanneer provider-/modelruntimebeleid expliciet `pi` selecteert.

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI-runtimes gebruiken dezelfde splitsing: kies canonieke modelverwijzingen zoals `anthropic/claude-*`, `google/gemini-*` of `openai/gpt-*`, en stel vervolgens provider-/modelruntimebeleid in op `claude-cli`, `google-gemini-cli` of `codex-cli` wanneer je een lokale CLI-backend wilt.

    Legacy-`claude-cli/*`-, `google-gemini-cli/*`- en `codex-cli/*`-verwijzingen migreren terug naar canonieke providerverwijzingen, waarbij de runtime apart wordt vastgelegd.

  </Accordion>
</AccordionGroup>

## Provider-gedrag in eigendom van Plugins

De meeste providerspecifieke logica leeft in provider-plugins (`registerProvider(...)`), terwijl OpenClaw de generieke inferentieloop behoudt. Plugins zijn eigenaar van onboarding, modelcatalogi, auth-env-var-mapping, transport-/configuratienormalisatie, opschoning van toolschema's, failoverclassificatie, OAuth-refresh, gebruiksrapportage, denk-/redeneerprofielen en meer.

De volledige lijst met provider-SDK-hooks en voorbeelden van gebundelde plugins staat in [Provider-plugins](/nl/plugins/sdk-provider-plugins). Een provider die een volledig aangepaste request-executor nodig heeft, is een apart, dieper uitbreidingsoppervlak.

<Note>
Runner-gedrag in eigendom van providers leeft op expliciete provider-hooks zoals replaybeleid, toolschema-normalisatie, stream-wrapping en transport-/requesthelpers. De legacy statische bag `ProviderPlugin.capabilities` is alleen voor compatibiliteit en wordt niet meer gelezen door gedeelde runnerlogica.
</Note>

## API-sleutelrotatie

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Configureer meerdere sleutels via:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (enkele live-overschrijving, hoogste prioriteit)
    - `<PROVIDER>_API_KEYS` (lijst gescheiden door komma's of puntkomma's)
    - `<PROVIDER>_API_KEY` (primaire sleutel)
    - `<PROVIDER>_API_KEY_*` (genummerde lijst, bijv. `<PROVIDER>_API_KEY_1`)

    Voor Google-providers wordt `GOOGLE_API_KEY` ook opgenomen als fallback. De sleutelvolgorde behoudt prioriteit en dedupliceert waarden.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - Requests worden alleen opnieuw geprobeerd met de volgende sleutel bij rate-limit-responses (bijvoorbeeld `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` of periodieke gebruikslimietberichten).
    - Niet-rate-limit-fouten mislukken onmiddellijk; er wordt geen sleutelrotatie geprobeerd.
    - Wanneer alle kandidaatsleutels mislukken, wordt de uiteindelijke fout teruggegeven vanuit de laatste poging.

  </Accordion>
</AccordionGroup>

## Ingebouwde providers (pi-ai-catalogus)

OpenClaw wordt geleverd met de pi-ai-catalogus. Deze providers vereisen **geen** `models.providers`-configuratie; stel alleen auth in en kies een model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionele rotatie: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (enkele overschrijving)
- Voorbeeldmodellen: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifieer account-/modelbeschikbaarheid met `openclaw models list --provider openai` als een specifieke installatie of API-sleutel zich anders gedraagt.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standaardtransport is `auto`; OpenClaw geeft de transportkeuze door aan pi-ai.
- Overschrijf per model via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- OpenAI-prioriteitsverwerking kan worden ingeschakeld via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` en `params.fastMode` mappen directe `openai/*` Responses-requests naar `service_tier=priority` op `api.openai.com`
- Gebruik `params.serviceTier` wanneer je een expliciete tier wilt in plaats van de gedeelde `/fast`-schakelaar
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) gelden alleen voor native OpenAI-verkeer naar `api.openai.com`, niet voor generieke OpenAI-compatibele proxy's
- Native OpenAI-routes behouden ook Responses `store`, prompt-cache-hints en OpenAI reasoning-compat payload-shaping; proxyroutes doen dat niet
- `openai/gpt-5.3-codex-spark` wordt bewust onderdrukt in OpenClaw omdat live OpenAI API-requests dit weigeren en de huidige Codex-catalogus dit niet blootstelt

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
  backend apart: `anthropic/claude-opus-4-7` met
  modelgescopeerde `agentRuntime.id: "claude-cli"`. Legacy-
  `claude-cli/claude-opus-4-7`-verwijzingen blijven werken voor compatibiliteit.

<Note>
Anthropic-medewerkers hebben ons verteld dat OpenClaw-achtig Claude CLI-gebruik weer is toegestaan, dus OpenClaw behandelt Claude CLI-hergebruik en `claude -p`-gebruik als gesanctioneerd voor deze integratie, tenzij Anthropic nieuw beleid publiceert. Anthropic setup-token blijft beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan Claude CLI-hergebruik en `claude -p` wanneer beschikbaar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Legacy PI-modelverwijzing: `openai-codex/gpt-5.5`
- Native Codex app-server-harnessverwijzing: `openai/gpt-5.5`
- Documentatie voor native Codex app-server-harness: [Codex-harness](/nl/plugins/codex-harness)
- Legacy-modelverwijzingen: `codex/gpt-*`
- Plugin-grens: `openai-codex/*` laadt de OpenAI-plugin; de native Codex app-server-plugin wordt alleen geselecteerd door de Codex-harnessruntime of legacy-`codex/*`-verwijzingen.
- CLI: `openclaw onboard --auth-choice openai-codex` of `openclaw models auth login --provider openai-codex`
- Standaardtransport is `auto` (WebSocket eerst, SSE als fallback)
- Overschrijf per PI-model via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` of `"auto"`)
- `params.serviceTier` wordt ook doorgestuurd bij native Codex Responses-requests (`chatgpt.com/backend-api`)
- Verborgen OpenClaw-attributieheaders (`originator`, `version`, `User-Agent`) worden alleen toegevoegd aan native Codex-verkeer naar `chatgpt.com/backend-api`, niet aan generieke OpenAI-compatibele proxy's
- Deelt dezelfde `/fast`-schakelaar en `params.fastMode`-configuratie als directe `openai/*`; OpenClaw mapt dat naar `service_tier=priority`
- `openai-codex/gpt-5.5` gebruikt de native `contextWindow = 400000` van de Codex-catalogus en standaardruntime `contextTokens = 272000`; overschrijf de runtimecap met `models.providers.openai-codex.models[].contextTokens`
- Beleidsnotitie: OpenAI Codex OAuth wordt expliciet ondersteund voor externe tools/workflows zoals OpenClaw.
- Voor de gebruikelijke abonnementsroute plus native Codex-runtime meld je je aan met `openai-codex`-auth, maar configureer je `openai/gpt-5.5`; OpenAI-agentbeurten selecteren standaard Codex.
- Gebruik provider-/model-`agentRuntime.id: "pi"` alleen wanneer je een compatibiliteitsroute via PI wilt; laat `openai/gpt-5.5` anders op de standaard Codex-harness staan.
- Oudere `openai-codex/gpt-5.1*`-, `openai-codex/gpt-5.2*`- en `openai-codex/gpt-5.3*`-verwijzingen worden onderdrukt omdat ChatGPT/Codex OAuth-accounts die weigeren; gebruik in plaats daarvan `openai-codex/gpt-5.5` of de native Codex-runtimeroute.

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
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Andere gehoste opties in abonnementsstijl

<CardGroup cols={3}>
  <Card title="GLM models" href="/nl/providers/glm">
    Z.AI Coding Plan of algemene API-eindpunten.
  </Card>
  <Card title="MiniMax" href="/nl/providers/minimax">
    MiniMax Coding Plan OAuth of toegang via API-sleutel.
  </Card>
  <Card title="Qwen Cloud" href="/nl/providers/qwen">
    Qwen Cloud-providersurface plus Alibaba DashScope- en Coding Plan-eindpuntmapping.
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

- Aanbieder: `google`
- Authenticatie: `GEMINI_API_KEY`
- Optionele rotatie: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback op `GOOGLE_API_KEY` en `OPENCLAW_LIVE_GEMINI_KEY` (enkele override)
- Voorbeeldmodellen: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibiliteit: verouderde OpenClaw-configuratie die `google/gemini-3.1-flash-preview` gebruikt, wordt genormaliseerd naar `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` wordt geaccepteerd en genormaliseerd naar Google's live Gemini API-id, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denken: `/think adaptive` gebruikt Google dynamic thinking. Gemini 3/3.1 laten een vaste `thinkingLevel` weg; Gemini 2.5 verzendt `thinkingBudget: -1`.
- Directe Gemini-uitvoeringen accepteren ook `agents.defaults.models["google/<model>"].params.cachedContent` (of verouderd `cached_content`) om een provider-native `cachedContents/...`-handle door te sturen; Gemini-cachehits verschijnen als OpenClaw `cacheRead`

### Google Vertex en Gemini CLI

- Aanbieders: `google-vertex`, `google-gemini-cli`
- Authenticatie: Vertex gebruikt gcloud ADC; Gemini CLI gebruikt de eigen OAuth-flow

<Warning>
Gemini CLI OAuth in OpenClaw is een onofficiële integratie. Sommige gebruikers hebben Google-accountbeperkingen gemeld na het gebruik van clients van derden. Controleer de voorwaarden van Google en gebruik een niet-kritiek account als je ervoor kiest door te gaan.
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

    Standaardmodel: `google-gemini-cli/gemini-3-flash-preview`. Je plakt **geen** client-id of geheim in `openclaw.json`. De CLI-inlogflow slaat tokens op in authenticatieprofielen op de gatewayhost.

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
  - `zai-api-key` detecteert automatisch het overeenkomende Z.AI-eindpunt; `zai-coding-global`, `zai-coding-cn`, `zai-global` en `zai-cn` dwingen een specifiek oppervlak af

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
- De statische fallbackcatalogus levert `kilocode/kilo/auto`; live-detectie via `https://api.kilo.ai/api/gateway/models` kan de runtimecatalogus verder uitbreiden.
- Exacte upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway en niet hardgecodeerd in OpenClaw.

Zie [/providers/kilocode](/nl/providers/kilocode) voor installatiedetails.

### Andere gebundelde provider-Plugins

| Provider                | Id                               | Auth-env                                                     | Voorbeeldmodel                                |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
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

#### Eigenaardigheden die nuttig zijn om te weten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Past zijn app-toeschrijvingsheaders en Anthropic `cache_control`-markeringen alleen toe op geverifieerde `openrouter.ai`-routes. DeepSeek-, Moonshot- en ZAI-referenties komen in aanmerking voor cache-TTL voor door OpenRouter beheerde promptcaching, maar ontvangen geen Anthropic-cachemarkeringen. Als proxy-achtige OpenAI-compatibele route slaat het vormgeving over die alleen voor native OpenAI geldt (`serviceTier`, Responses `store`, prompt-cachehints, OpenAI-reasoningcompatibiliteit). Gemini-ondersteunde referenties behouden alleen de proxy-Gemini-opschoning van thought-signatures.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-ondersteunde referenties volgen hetzelfde proxy-Gemini-opschoningspad; `kilocode/kilo/auto` en andere referenties zonder ondersteuning voor proxy-reasoning slaan proxy-reasoninginjectie over.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding met API-sleutel schrijft expliciete chatmodeldefinities voor alleen tekst voor M2.7; beeldbegrip blijft op de door de plugin beheerde `MiniMax-VL-01`-mediaprovider.
  </Accordion>
  <Accordion title="NVIDIA">
    Model-id's gebruiken een `nvidia/<vendor>/<model>`-naamruimte (bijvoorbeeld `nvidia/nvidia/nemotron-...` naast `nvidia/moonshotai/kimi-k2.5`); selectors behouden de letterlijke `<provider>/<model-id>`-samenstelling terwijl de canonieke sleutel die naar de API wordt verzonden enkelvoudig geprefixt blijft.
  </Accordion>
  <Accordion title="xAI">
    Gebruikt het xAI Responses-pad. `grok-4.3` is het meegeleverde standaardchatmodel. `/fast` of `params.fastMode: true` herschrijft `grok-3`, `grok-3-mini`, `grok-4` en `grok-4-0709` naar hun `*-fast`-varianten. `tool_stream` staat standaard aan; schakel uit via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Wordt geleverd als de meegeleverde `cerebras`-providerplugin. GLM gebruikt `zai-glm-4.7`; de OpenAI-compatibele basis-URL is `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Providers via `models.providers` (aangepaste/basis-URL)

Gebruik `models.providers` (of `models.json`) om **aangepaste** providers of OpenAI/Anthropic-compatibele proxies toe te voegen.

Veel van de onderstaande meegeleverde providerplugins publiceren al een standaardcatalogus. Gebruik expliciete `models.providers.<id>`-vermeldingen alleen wanneer je de standaardbasis-URL, headers of modellijst wilt overschrijven.

Gateway-modelcapaciteitscontroles lezen ook expliciete `models.providers.<id>.models[]`-metadata. Als een aangepast of proxymodel afbeeldingen accepteert, stel dan `input: ["text", "image"]` in op dat model zodat WebChat en attachmentpaden met node-oorsprong afbeeldingen doorgeven als native modelinvoer in plaats van mediareferenties voor alleen tekst.

`agents.defaults.models["provider/model"]` beheert alleen modelzichtbaarheid, aliassen en metadata per model voor agents. Het registreert op zichzelf geen nieuw runtimemodel. Voeg voor aangepaste providermodellen ook `models.providers.<provider>.models[]` toe met ten minste de overeenkomende `id`.

### Moonshot AI (Kimi)

Moonshot wordt geleverd als een meegeleverde providerplugin. Gebruik standaard de ingebouwde provider en voeg alleen een expliciete `models.providers.moonshot`-vermelding toe wanneer je de basis-URL of modelmetadata moet overschrijven:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Voorbeeldmodel: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` or `openclaw onboard --auth-choice moonshot-api-key-cn`

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

### Kimi coding

Kimi Coding gebruikt Moonshot AI's Anthropic-compatibele endpoint:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Voorbeeldmodel: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Verouderde `kimi/kimi-code` en `kimi/k2p5` blijven geaccepteerd als compatibiliteitsmodel-id's en worden genormaliseerd naar Kimi's stabiele API-model-id.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) biedt toegang tot Doubao en andere modellen in China.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Voorbeeldmodel: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding gebruikt standaard het coding-oppervlak, maar de algemene `volcengine/*`-catalogus wordt tegelijk geregistreerd.

In modelkiezers voor onboarding/configuratie geeft de Volcengine-authkeuze de voorkeur aan zowel `volcengine/*`- als `volcengine-plan/*`-rijen. Als die modellen nog niet geladen zijn, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gescopete kiezer te tonen.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (internationaal)

BytePlus ARK biedt internationale gebruikers toegang tot dezelfde modellen als Volcano Engine.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Voorbeeldmodel: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding gebruikt standaard het coding-oppervlak, maar de algemene `byteplus/*`-catalogus wordt tegelijk geregistreerd.

In modelkiezers voor onboarding/configuratie geeft de BytePlus-authkeuze de voorkeur aan zowel `byteplus/*`- als `byteplus-plan/*`-rijen. Als die modellen nog niet geladen zijn, valt OpenClaw terug op de ongefilterde catalogus in plaats van een lege provider-gescopete kiezer te tonen.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
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

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-sleutel (Global): `--auth-choice minimax-global-api`
- MiniMax API-sleutel (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` voor `minimax`; `MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` voor `minimax-portal`

Zie [/providers/minimax](/nl/providers/minimax) voor installatiedetails, modelopties en configuratiefragmenten.

<Note>
Op MiniMax's Anthropic-compatibele streamingpad schakelt OpenClaw thinking standaard uit, tenzij je het expliciet instelt, en `/fast on` herschrijft `MiniMax-M2.7` naar `MiniMax-M2.7-highspeed`.
</Note>

Door Plugin beheerde capaciteitssplitsing:

- Standaardinstellingen voor tekst/chat blijven op `minimax/MiniMax-M2.7`
- Afbeeldingsgeneratie is `minimax/image-01` of `minimax-portal/image-01`
- Afbeeldingsbegrip is door Plugin beheerde `MiniMax-VL-01` op beide MiniMax-authpaden
- Webzoekopdrachten blijven op provider-id `minimax`

### LM Studio

LM Studio wordt geleverd als gebundelde provider-Plugin die de native API gebruikt:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standaard basis-URL voor inferentie: `http://localhost:1234/v1`

Stel daarna een model in (vervang dit door een van de id's die `http://localhost:1234/api/v1/models` retourneert):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw gebruikt LM Studio's native `/api/v1/models` en `/api/v1/models/load` voor detectie + automatisch laden, met standaard `/v1/chat/completions` voor inferentie. Als je wilt dat LM Studio JIT-laden, TTL en automatisch verwijderen eigenaar zijn van de modellevenscyclus, stel dan `models.providers.lmstudio.params.preload: false` in. Zie [/providers/lmstudio](/nl/providers/lmstudio) voor installatie en probleemoplossing.

### Ollama

Ollama wordt geleverd als gebundelde provider-Plugin en gebruikt Ollama's native API:

- Provider: `ollama`
- Auth: Geen vereist (lokale server)
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

vLLM wordt geleverd als gebundelde provider-Plugin voor lokale/zelfgehoste OpenAI-compatibele servers:

- Provider: `vllm`
- Auth: Optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:8000/v1`

Om je lokaal aan te melden voor automatische detectie (elke waarde werkt als je server geen auth afdwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Stel daarna een model in (vervang dit door een van de id's die `/v1/models` retourneert):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Zie [/providers/vllm](/nl/providers/vllm) voor details.

### SGLang

SGLang wordt geleverd als gebundelde provider-Plugin voor snelle zelfgehoste OpenAI-compatibele servers:

- Provider: `sglang`
- Auth: Optioneel (afhankelijk van je server)
- Standaard basis-URL: `http://127.0.0.1:30000/v1`

Om je lokaal aan te melden voor automatische detectie (elke waarde werkt als je server geen auth afdwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Stel daarna een model in (vervang dit door een van de id's die `/v1/models` retourneert):

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
  <Accordion title="Default optional fields">
    Voor aangepaste providers zijn `reasoning`, `input`, `cost`, `contextWindow` en `maxTokens` optioneel. Wanneer ze worden weggelaten, gebruikt OpenClaw standaard:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Aanbevolen: stel expliciete waarden in die overeenkomen met de limieten van je proxy/model.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Voor `api: "openai-completions"` op niet-native endpoints (elke niet-lege `baseUrl` waarvan de host niet `api.openai.com` is), forceert OpenClaw `compat.supportsDeveloperRole: false` om provider-400-fouten voor niet-ondersteunde `developer`-rollen te voorkomen.
    - Proxy-achtige OpenAI-compatibele routes slaan ook native OpenAI-only request shaping over: geen `service_tier`, geen Responses `store`, geen Completions `store`, geen prompt-cache-hints, geen OpenAI reasoning-compat payload shaping en geen verborgen OpenClaw-attributieheaders.
    - Voor OpenAI-compatibele Completions-proxy's die leverancierspecifieke velden nodig hebben, stel je `agents.defaults.models["provider/model"].params.extra_body` (of `extraBody`) in om extra JSON samen te voegen in de uitgaande requestbody.
    - Voor vLLM-chattemplatebesturing stel je `agents.defaults.models["provider/model"].params.chat_template_kwargs` in. De gebundelde vLLM-Plugin verzendt automatisch `enable_thinking: false` en `force_nonempty_content: true` voor `vllm/nemotron-3-*` wanneer het thinking-niveau van de sessie uit staat.
    - Voor trage lokale modellen of externe LAN-/tailnet-hosts stel je `models.providers.<id>.timeoutSeconds` in. Dit verlengt de afhandeling van HTTP-requests voor provider-modellen, inclusief connectie, headers, body-streaming en de totale guarded-fetch-abort, zonder de runtime-time-out van de hele agent te verhogen.
    - HTTP-aanroepen van modelproviders staan Surge-, Clash- en sing-box-fake-IP-DNS-antwoorden in `198.18.0.0/15` en `fc00::/7` alleen toe voor de geconfigureerde provider-`baseUrl`-hostnaam. Andere private, loopback-, link-local- en metadata-bestemmingen vereisen nog steeds een expliciete opt-in met `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Als `baseUrl` leeg is of is weggelaten, behoudt OpenClaw het standaardgedrag van OpenAI (dat naar `api.openai.com` resolveert).
    - Voor veiligheid wordt een expliciete `compat.supportsDeveloperRole: true` nog steeds overschreven op niet-native `openai-completions`-endpoints.
    - Voor `api: "anthropic-messages"` op niet-directe endpoints (elke provider anders dan canonieke `anthropic`, of een aangepaste `models.providers.anthropic.baseUrl` waarvan de host geen publiek `api.anthropic.com`-endpoint is), onderdrukt OpenClaw impliciete Anthropic-betaheaders zoals `claude-code-20250219`, `interleaved-thinking-2025-05-14` en OAuth-markeringen, zodat aangepaste Anthropic-compatibele proxy's niet-ondersteunde betaflags niet afwijzen. Stel `models.providers.<id>.headers["anthropic-beta"]` expliciet in als je proxy specifieke betafuncties nodig heeft.

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
- [Modelfailover](/nl/concepts/model-failover) - fallbackketens en retrygedrag
- [Modellen](/nl/concepts/models) - modelconfiguratie en aliassen
- [Providers](/nl/providers) - installatierichtlijnen per provider
