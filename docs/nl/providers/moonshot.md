---
read_when:
    - Je wilt Moonshot K2 (Moonshot Open Platform) versus Kimi Coding configureren
    - Je moet afzonderlijke endpoints, sleutels en modelverwijzingen begrijpen
    - Je wilt configuratie voor beide providers kunnen kopiëren en plakken
summary: Configureer Moonshot K2 versus Kimi Coding (afzonderlijke providers + sleutels)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot biedt de Kimi API met OpenAI-compatibele eindpunten. Configureer de
provider en stel het standaardmodel in op `moonshot/kimi-k2.6`, of gebruik
Kimi Coding met `kimi/kimi-for-coding`.

<Warning>
Moonshot en Kimi Coding zijn **afzonderlijke providers**. Sleutels zijn niet uitwisselbaar, eindpunten verschillen en modelverwijzingen verschillen (`moonshot/...` versus `kimi/...`).
</Warning>

## Ingebouwde modelcatalogus

[//]: # "moonshot-kimi-k2-ids:start"

| Modelverwijzing                  | Naam                   | Redeneren | Invoer           | Context | Max. uitvoer |
| --------------------------------- | ---------------------- | --------- | ---------------- | ------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nee       | tekst, afbeelding | 262,144 | 262,144      |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Altijd aan | tekst, afbeelding | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nee       | tekst, afbeelding | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja        | tekst            | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja        | tekst            | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nee       | tekst            | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Cataloguskostenramingen voor huidige door Moonshot gehoste K2-modellen gebruiken Moonshots
gepubliceerde pay-as-you-go-tarieven: Kimi K2.7 Code is $0.19/MTok cachehit,
$0.95/MTok invoer en $4.00/MTok uitvoer; Kimi K2.6 is $0.16/MTok cachehit,
$0.95/MTok invoer en $4.00/MTok uitvoer; Kimi K2.5 is $0.10/MTok cachehit,
$0.60/MTok invoer en $3.00/MTok uitvoer. Andere verouderde catalogusvermeldingen behouden
nul-kostenplaatshouders tenzij je ze in de configuratie overschrijft.

Kimi K2.7 Code gebruikt altijd native thinking. OpenClaw stelt alleen de `on`-
thinking-status voor dit model beschikbaar en laat uitgaande `thinking`- en
`reasoning_effort`-besturingselementen weg, zoals Moonshot vereist. OpenClaw laat ook
sampling-overschrijvingen weg die K2.7 vastzet op providerstandaarden. Kimi K2.6 blijft de
standaardwaarde voor onboarding.

## Aan de slag

Kies je provider en volg de installatiestappen.

<Tabs>
  <Tab title="Moonshot API">
    **Beste voor:** Kimi K2-modellen via het Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Auth-keuze             | Eindpunt                       | Regio         |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Internationaal |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Of voor het China-eindpunt:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Gebruik een geïsoleerde statusmap wanneer je modeltoegang en kostenregistratie wilt
        verifiëren zonder je normale sessies aan te raken:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        De JSON-respons moet `provider: "moonshot"` en
        `model: "kimi-k2.6"` rapporteren. De assistant-transcriptvermelding slaat genormaliseerd
        tokengebruik plus geschatte kosten op onder `usage.cost` wanneer Moonshot
        gebruiksmetadata retourneert.
      </Step>
    </Steps>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    Installeer de officiële Plugin en herstart daarna Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Beste voor:** codegerichte taken via het Kimi Coding-eindpunt.

    <Note>
    Kimi Coding gebruikt een andere API-sleutel en providerprefix (`kimi/...`) dan Moonshot (`moonshot/...`). De stabiele API-modelverwijzing is `kimi/kimi-for-coding`; verouderde verwijzingen `kimi/kimi-code` en `kimi/k2p5` blijven geaccepteerd en worden genormaliseerd naar die API-model-id.
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi-webzoekfunctie

De Moonshot-Plugin registreert **Kimi** ook als een `web_search`-provider, ondersteund door Moonshot-webzoekfunctie.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    Kies **Kimi** in de webzoeksectie om
    `plugins.entries.moonshot.config.webSearch.*` op te slaan.

  </Step>
  <Step title="Configure the web search region and model">
    Interactieve installatie vraagt om:

    | Instelling          | Opties                                                               |
    | ------------------- | -------------------------------------------------------------------- |
    | API-regio           | `https://api.moonshot.ai/v1` (internationaal) of `https://api.moonshot.cn/v1` (China) |
    | Webzoekmodel        | Standaard `kimi-k2.6`                                                |

  </Step>
</Steps>

Configuratie staat onder `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code gebruikt altijd native thinking. Moonshot vereist dat clients het
    veld `thinking` voor dit model weglaten, dus OpenClaw stelt alleen `on` beschikbaar en
    negeert verouderde `off`-instellingen. K2.7 zet ook `temperature`, `top_p`, `n`,
    `presence_penalty` en `frequency_penalty` vast; OpenClaw laat geconfigureerde
    overschrijvingen voor die velden weg.

    Andere Moonshot Kimi-modellen ondersteunen binaire native thinking:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configureer dit per model via `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw koppelt runtime-`/think`-niveaus voor die modellen:

    | `/think`-niveau     | Moonshot-gedrag          |
    | -------------------- | ------------------------ |
    | `/think off`         | `thinking.type=disabled` |
    | Elk niet-off-niveau  | `thinking.type=enabled`  |

    <Warning>
    Wanneer Moonshot-thinking is ingeschakeld, moet `tool_choice` `auto` of `none` zijn. OpenClaw normaliseert incompatibele waarden naar `auto`. Dit omvat Kimi K2.7 Code, waarvan de thinking-modus niet kan worden uitgeschakeld om een vastgezette toolkeuze te behouden.
    </Warning>

    Kimi K2.6 accepteert ook een optioneel veld `thinking.keep` dat de
    retentie over meerdere beurten van `reasoning_content` regelt. Stel dit in op `"all"` om volledige
    redenering tussen beurten te bewaren; laat het weg (of laat het `null`) om de
    standaardstrategie van de server te gebruiken. OpenClaw stuurt `thinking.keep` alleen door voor
    `moonshot/kimi-k2.6` en verwijdert het uit andere modellen. Kimi K2.7 Code
    bewaart standaard de volledige redeneergeschiedenis terwijl OpenClaw het volledige
    veld `thinking` weglaat.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Opschoning van tool call-id's">
    Moonshot Kimi levert native tool_call-id's met de vorm `functions.<name>:<index>`. Voor het OpenAI-completions-transport bewaart OpenClaw het eerste voorkomen van elke native Kimi-id en herschrijft latere duplicaten naar deterministische OpenAI-stijl `call_*`-id's. Overeenkomende toolresultaten worden opnieuw toegewezen met dezelfde id, zodat opnieuw afspelen uniek blijft zonder Kimi's eerste native id te verwijderen.

    Stel `sanitizeToolCallIds: true` in om strikte opschoning af te dwingen voor een aangepaste OpenAI-compatibele provider:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Compatibiliteit voor streaming-gebruik">
    Native Moonshot-endpoints (`https://api.moonshot.ai/v1` en
    `https://api.moonshot.cn/v1`) adverteren compatibiliteit voor streaming-gebruik op het
    gedeelde `openai-completions`-transport. OpenClaw baseert dat op endpoint-
    mogelijkheden, zodat compatibele aangepaste provider-id's die op dezelfde native
    Moonshot-hosts zijn gericht hetzelfde streaming-usage-gedrag overnemen.

    Met de catalogusprijsstelling voor K2.6 wordt gestreamd gebruik met invoer-,
    uitvoer- en cache-read-tokens ook omgezet naar lokale geschatte kosten in USD voor
    `/status`, `/usage full`, `/usage cost` en transcriptgebaseerde sessie-
    administratie.

  </Accordion>

  <Accordion title="Referentie voor endpoint en model-ref">
    | Provider   | Model-ref-prefix | Endpoint                      | Auth-env-var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding-endpoint          | `KIMI_API_KEY`      |
    | Webzoekfunctie | N.v.t.        | Hetzelfde als de Moonshot API-regio | `KIMI_API_KEY` of `MOONSHOT_API_KEY` |

    - Kimi-webzoekfunctie gebruikt `KIMI_API_KEY` of `MOONSHOT_API_KEY`, en gebruikt standaard `https://api.moonshot.ai/v1` met model `kimi-k2.6`.
    - Overschrijf prijsstelling en contextmetadata in `models.providers` indien nodig.
    - Als Moonshot andere contextlimieten voor een model publiceert, pas `contextWindow` dienovereenkomstig aan.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failover-gedrag kiezen.
  </Card>
  <Card title="Webzoekfunctie" href="/nl/tools/web" icon="magnifying-glass">
    Webzoekproviders configureren, waaronder Kimi.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configschema voor providers, modellen en Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API-sleutelbeheer en documentatie.
  </Card>
</CardGroup>
