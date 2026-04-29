---
read_when:
    - Je wilt Moonshot K2 (Moonshot Open Platform) versus Kimi Coding instellen
    - Je moet afzonderlijke eindpunten, sleutels en modelreferenties begrijpen
    - Je wilt kopieer-en-plakconfiguratie voor een van beide providers
summary: Moonshot K2 versus Kimi Coding configureren (afzonderlijke providers + sleutels)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-29T23:11:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot biedt de Kimi API met endpoints die compatibel zijn met OpenAI. Configureer de
provider en stel het standaardmodel in op `moonshot/kimi-k2.6`, of gebruik
Kimi Coding met `kimi/kimi-code`.

<Warning>
Moonshot en Kimi Coding zijn **afzonderlijke providers**. Sleutels zijn niet uitwisselbaar, endpoints verschillen en modelreferenties verschillen (`moonshot/...` versus `kimi/...`).
</Warning>

## Ingebouwde modelcatalogus

[//]: # "moonshot-kimi-k2-ids:start"

| Modelreferentie                  | Naam                   | Redeneren | Invoer             | Context | Max. uitvoer |
| --------------------------------- | ---------------------- | --------- | ------------------ | ------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nee       | tekst, afbeelding  | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nee       | tekst, afbeelding  | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja        | tekst              | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja        | tekst              | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nee       | tekst              | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Meegeleverde kostenramingen voor huidige door Moonshot gehoste K2-modellen gebruiken de
gepubliceerde tarieven van Moonshot voor betalen naar gebruik: Kimi K2.6 is $0.16/MTok cachetreffer,
$0.95/MTok invoer en $4.00/MTok uitvoer; Kimi K2.5 is $0.10/MTok cachetreffer,
$0.60/MTok invoer en $3.00/MTok uitvoer. Andere verouderde catalogusitems behouden
plaatsaanduidingen zonder kosten, tenzij je ze in de configuratie overschrijft.

## Aan de slag

Kies je provider en volg de installatiestappen.

<Tabs>
  <Tab title="Moonshot API">
    **Beste voor:** Kimi K2-modellen via het Moonshot Open Platform.

    <Steps>
      <Step title="Kies je endpointregio">
        | Auth-keuze             | Endpoint                       | Regio         |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Internationaal |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Instelproces uitvoeren">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Of voor het China-endpoint:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
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
      <Step title="Verifiëren dat modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Een live-smoketest uitvoeren">
        Gebruik een geïsoleerde state-map wanneer je modeltoegang en kostenregistratie
        wilt verifiëren zonder je normale sessies aan te raken:

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
        `model: "kimi-k2.6"` rapporteren. De transcriptvermelding van de assistent slaat genormaliseerd
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
    **Beste voor:** codegerichte taken via het Kimi Coding-endpoint.

    <Note>
    Kimi Coding gebruikt een andere API-sleutel en providerprefix (`kimi/...`) dan Moonshot (`moonshot/...`). De verouderde modelreferentie `kimi/k2p5` blijft geaccepteerd als compatibiliteits-id.
    </Note>

    <Steps>
      <Step title="Instelproces uitvoeren">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifiëren dat het model beschikbaar is">
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
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi-webzoekfunctie

OpenClaw levert ook **Kimi** als `web_search`-provider, ondersteund door de
webzoekfunctie van Moonshot.

<Steps>
  <Step title="Interactieve webzoekconfiguratie uitvoeren">
    ```bash
    openclaw configure --section web
    ```

    Kies **Kimi** in de webzoeksectie om
    `plugins.entries.moonshot.config.webSearch.*` op te slaan.

  </Step>
  <Step title="De regio en het model voor webzoeken configureren">
    De interactieve configuratie vraagt om:

    | Instelling          | Opties                                                               |
    | ------------------- | -------------------------------------------------------------------- |
    | API-regio           | `https://api.moonshot.ai/v1` (internationaal) or `https://api.moonshot.cn/v1` (China) |
    | Webzoekmodel        | Standaard ingesteld op `kimi-k2.6`                                  |

  </Step>
</Steps>

De configuratie staat onder `plugins.entries.moonshot.config.webSearch`:

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
  <Accordion title="Natieve denkmodus">
    Moonshot Kimi ondersteunt binaire natieve denkmodus:

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

    OpenClaw koppelt ook runtime-`/think`-niveaus voor Moonshot:

    | `/think`-niveau     | Moonshot-gedrag           |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Elk niveau behalve off | `thinking.type=enabled`  |

    <Warning>
    Wanneer Moonshot-denkmodus is ingeschakeld, moet `tool_choice` `auto` of `none` zijn. OpenClaw normaliseert incompatibele `tool_choice`-waarden naar `auto` voor compatibiliteit.
    </Warning>

    Kimi K2.6 accepteert ook een optioneel `thinking.keep`-veld dat het
    multi-turn-behoud van `reasoning_content` regelt. Stel het in op `"all"` om volledige
    redenering over beurten heen te behouden; laat het weg (of laat het `null`) om de
    standaardstrategie van de server te gebruiken. OpenClaw stuurt `thinking.keep` alleen door voor
    `moonshot/kimi-k2.6` en verwijdert het uit andere modellen.

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

  <Accordion title="Opschoning van toolaanroep-id's">
    Moonshot Kimi levert `tool_call`-id's met de vorm `functions.<name>:<index>`. OpenClaw behoudt ze ongewijzigd zodat toolaanroepen over meerdere beurten blijven werken.

    Om strikte opschoning af te dwingen voor een aangepaste provider die compatibel is met OpenAI, stel je `sanitizeToolCallIds: true` in:

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

  <Accordion title="Compatibiliteit voor streaminggebruik">
    Native Moonshot-endpoints (`https://api.moonshot.ai/v1` en
    `https://api.moonshot.cn/v1`) adverteren compatibiliteit voor streaminggebruik op het
    gedeelde `openai-completions`-transport. OpenClaw baseert dat op endpointmogelijkheden,
    zodat compatibele aangepaste provider-ID's die op dezelfde native
    Moonshot-hosts zijn gericht hetzelfde streaminggebruiksgedrag erven.

    Met de meegeleverde K2.6-prijzen wordt gestreamd gebruik dat invoer-, uitvoer-
    en cacheleestokens bevat ook omgezet naar lokaal geschatte kosten in USD voor
    `/status`, `/usage full`, `/usage cost` en transcriptgebaseerde sessieboekhouding.

  </Accordion>

  <Accordion title="Endpoint- en modelref-referentie">
    | Provider   | Modelref-prefix | Endpoint                      | Auth-env-var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding-endpoint          | `KIMI_API_KEY`      |
    | Webzoekopdracht | N.v.t.       | Zelfde als de Moonshot API-regio | `KIMI_API_KEY` of `MOONSHOT_API_KEY` |

    - Kimi-webzoekopdracht gebruikt `KIMI_API_KEY` of `MOONSHOT_API_KEY` en gebruikt standaard `https://api.moonshot.ai/v1` met model `kimi-k2.6`.
    - Overschrijf indien nodig prijs- en contextmetadata in `models.providers`.
    - Als Moonshot andere contextlimieten voor een model publiceert, pas `contextWindow` dienovereenkomstig aan.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failover-gedrag kiezen.
  </Card>
  <Card title="Webzoekopdracht" href="/nl/tools/web" icon="magnifying-glass">
    Providers voor webzoekopdrachten configureren, waaronder Kimi.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig config-schema voor providers, modellen en plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API-sleutelbeheer en documentatie.
  </Card>
</CardGroup>
