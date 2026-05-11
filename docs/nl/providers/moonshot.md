---
read_when:
    - Je wilt Moonshot K2 (Moonshot Open Platform) versus Kimi Coding instellen
    - Je moet afzonderlijke eindpunten, sleutels en modelreferenties begrijpen
    - Je wilt kopieer-en-plakconfiguratie voor een van beide providers
summary: Moonshot K2 versus Kimi Coding configureren (afzonderlijke providers + sleutels)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-11T20:47:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot biedt de Kimi API met OpenAI-compatibele eindpunten. Configureer de
aanbieder en stel het standaardmodel in op `moonshot/kimi-k2.6`, of gebruik
Kimi Coding met `kimi/kimi-for-coding`.

<Warning>
Moonshot en Kimi Coding zijn **afzonderlijke aanbieders**. Sleutels zijn niet uitwisselbaar, eindpunten verschillen en modelverwijzingen verschillen (`moonshot/...` versus `kimi/...`).
</Warning>

## Ingebouwde modelcatalogus

[//]: # "moonshot-kimi-k2-ids:start"

| Modelverwijzing                   | Naam                   | Redeneren | Invoer            | Context | Maximale uitvoer |
| --------------------------------- | ---------------------- | --------- | ----------------- | ------- | ---------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nee       | tekst, afbeelding | 262,144 | 262,144          |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nee       | tekst, afbeelding | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja        | tekst             | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja        | tekst             | 262,144 | 262,144          |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nee       | tekst             | 256,000 | 16,384           |

[//]: # "moonshot-kimi-k2-ids:end"

Meegeleverde kostenramingen voor huidige door Moonshot gehoste K2-modellen gebruiken de
gepubliceerde pay-as-you-go-tarieven van Moonshot: Kimi K2.6 kost $0.16/MTok bij cachehit,
$0.95/MTok invoer en $4.00/MTok uitvoer; Kimi K2.5 kost $0.10/MTok bij cachehit,
$0.60/MTok invoer en $3.00/MTok uitvoer. Andere verouderde catalogusvermeldingen behouden
placeholders zonder kosten, tenzij je ze in de configuratie overschrijft.

## Aan de slag

Kies je aanbieder en volg de installatiestappen.

<Tabs>
  <Tab title="Moonshot API">
    **Beste voor:** Kimi K2-modellen via het Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Auth-keuze            | Eindpunt                       | Regio         |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | Internationaal |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | China         |
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
        Gebruik een geisoleerde statusmap wanneer je modeltoegang en kostentracking wilt verifiëren
        zonder je normale sessies aan te raken:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Het JSON-antwoord moet `provider: "moonshot"` en
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
    **Beste voor:** codegerichte taken via het Kimi Coding-eindpunt.

    <Note>
    Kimi Coding gebruikt een andere API-sleutel en aanbiedervoorvoegsel (`kimi/...`) dan Moonshot (`moonshot/...`). De stabiele API-modelverwijzing is `kimi/kimi-for-coding`; verouderde verwijzingen `kimi/kimi-code` en `kimi/k2p5` blijven geaccepteerd en worden genormaliseerd naar dat API-model-id.
    </Note>

    <Steps>
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

## Kimi-webzoekopdracht

OpenClaw levert ook **Kimi** als `web_search`-provider, ondersteund door Moonshot-webzoekopdrachten.

<Steps>
  <Step title="Interactieve webzoekconfiguratie uitvoeren">
    ```bash
    openclaw configure --section web
    ```

    Kies **Kimi** in de webzoeksectie om
    `plugins.entries.moonshot.config.webSearch.*` op te slaan.

  </Step>
  <Step title="De regio en het model voor webzoekopdrachten configureren">
    Interactieve configuratie vraagt om:

    | Instelling          | Opties                                                               |
    | ------------------- | -------------------------------------------------------------------- |
    | API-regio           | `https://api.moonshot.ai/v1` (internationaal) of `https://api.moonshot.cn/v1` (China) |
    | Webzoekmodel        | Standaard ingesteld op `kimi-k2.6`                                  |

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
  <Accordion title="Native denkmodus">
    Moonshot Kimi ondersteunt binaire native denkmodus:

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

    | `/think`-niveau      | Moonshot-gedrag           |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Elk niet-off-niveau  | `thinking.type=enabled`    |

    <Warning>
    Wanneer Moonshot-thinking is ingeschakeld, moet `tool_choice` `auto` of `none` zijn. OpenClaw normaliseert incompatibele `tool_choice`-waarden naar `auto` voor compatibiliteit.
    </Warning>

    Kimi K2.6 accepteert ook een optioneel veld `thinking.keep` dat het
    bewaren van `reasoning_content` over meerdere beurten regelt. Stel dit in op `"all"` om de volledige
    reasoning tussen beurten te bewaren; laat het weg (of laat het `null`) om de standaardstrategie
    van de server te gebruiken. OpenClaw stuurt `thinking.keep` alleen door voor
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

  <Accordion title="Tool call id sanitization">
    Moonshot Kimi levert tool_call-id's in de vorm `functions.<name>:<index>`. OpenClaw behoudt ze ongewijzigd, zodat tool calls over meerdere beurten blijven werken.

    Stel `sanitizeToolCallIds: true` in om strikte sanitisatie af te dwingen voor een aangepaste OpenAI-compatibele provider:

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

  <Accordion title="Streaming usage compatibility">
    Native Moonshot-endpoints (`https://api.moonshot.ai/v1` en
    `https://api.moonshot.cn/v1`) kondigen compatibiliteit met streaming-gebruik aan op het
    gedeelde `openai-completions`-transport. OpenClaw baseert dat op endpoint-
    mogelijkheden, zodat compatibele aangepaste provider-id's die op dezelfde native
    Moonshot-hosts zijn gericht hetzelfde streaming-gebruiksgedrag overnemen.

    Met de gebundelde K2.6-prijzen wordt gestreamd gebruik dat invoer-, uitvoer-
    en cache-read-tokens bevat ook omgezet naar lokale geschatte kosten in USD voor
    `/status`, `/usage full`, `/usage cost` en sessieboekhouding op basis van transcripts.

  </Accordion>

  <Accordion title="Referentie voor endpoints en modelverwijzingen">
    | Provider   | Prefix voor modelverwijzing | Endpoint                      | Auth-omgevingsvariabele |
    | ---------- | --------------------------- | ----------------------------- | ----------------------- |
    | Moonshot   | `moonshot/`                 | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`      |
    | Moonshot CN| `moonshot/`                 | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`      |
    | Kimi Coding| `kimi/`                     | Kimi Coding-endpoint          | `KIMI_API_KEY`          |
    | Webzoekfunctie | N.v.t.                  | Zelfde als Moonshot API-regio | `KIMI_API_KEY` of `MOONSHOT_API_KEY` |

    - Kimi-webzoekfunctie gebruikt `KIMI_API_KEY` of `MOONSHOT_API_KEY`, en gebruikt standaard `https://api.moonshot.ai/v1` met model `kimi-k2.6`.
    - Overschrijf indien nodig prijs- en contextmetadata in `models.providers`.
    - Als Moonshot andere contextlimieten voor een model publiceert, pas `contextWindow` dienovereenkomstig aan.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Webzoekfunctie" href="/nl/tools/web" icon="magnifying-glass">
    Webzoekproviders configureren, inclusief Kimi.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema voor providers, modellen en plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Beheer en documentatie van Moonshot API-sleutels.
  </Card>
</CardGroup>
