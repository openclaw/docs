---
read_when:
    - Je wilt Moonshot K2 (Moonshot Open Platform) instellen tegenover Kimi Coding
    - Je moet afzonderlijke eindpunten, sleutels en modelreferenties begrijpen
    - Je wilt een configuratie die je voor beide providers kunt kopiëren en plakken
summary: Moonshot K2 versus Kimi Coding configureren (afzonderlijke providers en sleutels)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T09:19:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot biedt de Kimi-API via OpenAI-compatibele eindpunten. Stel voor het Moonshot Open Platform het standaardmodel in op `moonshot/kimi-k2.6`, of op `kimi/kimi-for-coding` voor Kimi Coding.

<Warning>
Moonshot en Kimi Coding zijn **afzonderlijke providers**, die elk als een afzonderlijke externe plugin worden geleverd. Sleutels zijn niet onderling uitwisselbaar, eindpunten verschillen en modelverwijzingen verschillen (`moonshot/...` tegenover `kimi/...`).
</Warning>

## Ingebouwde modelcatalogus

[//]: # "moonshot-kimi-k2-ids:start"

| Modelverwijzing                   | Naam                   | Redeneren    | Invoer         | Context | Maximale uitvoer |
| --------------------------------- | ---------------------- | ------------ | -------------- | ------- | ---------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nee          | tekst, beeld   | 262,144 | 262,144          |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Altijd aan   | tekst, beeld   | 262,144 | 262,144          |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nee          | tekst, beeld   | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja           | tekst          | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja           | tekst          | 262,144 | 262,144          |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nee          | tekst          | 256,000 | 16,384           |

[//]: # "moonshot-kimi-k2-ids:end"

De kostenramingen in de catalogus gebruiken de gepubliceerde tarieven van Moonshot voor betalen naar gebruik: Kimi K2.7 Code kost $0.19/MTok bij een cachetreffer, $0.95/MTok voor invoer en $4.00/MTok voor uitvoer; Kimi K2.6 kost $0.16/MTok bij een cachetreffer, $0.95/MTok voor invoer en $4.00/MTok voor uitvoer; Kimi K2.5 kost $0.10/MTok bij een cachetreffer, $0.60/MTok voor invoer en $3.00/MTok voor uitvoer. Andere catalogusvermeldingen behouden tijdelijke waarden zonder kosten, tenzij u deze in de configuratie overschrijft.

Kimi K2.7 Code gebruikt altijd systeemeigen redeneren. OpenClaw stelt voor dit model alleen de redeneerstatus `on` beschikbaar en laat de uitgaande velden `thinking` en `reasoning_effort` weg, zoals Moonshot vereist. Ook worden overschrijvingen van bemonsteringsinstellingen (`temperature`, `top_p`, `n`, `presence_penalty`, `frequency_penalty`) weggelaten, omdat K2.7 hiervoor de standaardwaarden van de provider vastlegt. Kimi K2.6 blijft de standaard voor de eerste configuratie.

## Aan de slag

Moonshot en Kimi Coding zijn beide externe plugins. Installeer er één voordat u de eerste configuratie uitvoert.

<Tabs>
  <Tab title="Moonshot-API">
    **Meest geschikt voor:** Kimi K2-modellen via het Moonshot Open Platform.

    <Steps>
      <Step title="Installeer de plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Kies de regio van uw eindpunt">
        | Verificatiekeuze       | Eindpunt                       | Regio         |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Internationaal |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Voer de eerste configuratie uit">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Of voor het Chinese eindpunt:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Stel een standaardmodel in">
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
      <Step title="Controleer of de modellen beschikbaar zijn">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Voer een live-rooktest uit">
        Gebruik een geïsoleerde statusmap wanneer u modeltoegang en kostenregistratie wilt controleren zonder uw normale sessies te wijzigen:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Het JSON-antwoord moet `provider: "moonshot"` en `model: "kimi-k2.6"` vermelden. Wanneer Moonshot gebruiksmetagegevens retourneert, slaat de transcriptvermelding van de assistent het genormaliseerde tokengebruik en de geschatte kosten op onder `usage.cost`.
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
    **Meest geschikt voor:** codegerichte taken via het Kimi Coding-eindpunt.

    <Note>
    Kimi Coding gebruikt een andere API-sleutel en een ander providerprefix (`kimi/...`) dan Moonshot (`moonshot/...`). De stabiele modelverwijzing is `kimi/kimi-for-coding`; de verouderde verwijzingen `kimi/kimi-code` en `kimi/k2p5` blijven geaccepteerd en worden genormaliseerd naar die model-id.
    </Note>

    <Steps>
      <Step title="Installeer de plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Voer de eerste configuratie uit">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Stel een standaardmodel in">
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
      <Step title="Controleer of het model beschikbaar is">
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

## Zoeken op het web met Kimi

De Moonshot-plugin registreert **Kimi** ook als een `web_search`-provider, ondersteund door de webzoekfunctie van Moonshot.

<Steps>
  <Step title="Voer de interactieve configuratie voor zoeken op het web uit">
    ```bash
    openclaw configure --section web
    ```

    Kies **Kimi** in de sectie voor zoeken op het web om `plugins.entries.moonshot.config.webSearch.*` op te slaan.

  </Step>
  <Step title="Configureer de regio en het model voor zoeken op het web">
    De interactieve configuratie vraagt om:

    | Instelling              | Opties                                                               |
    | ----------------------- | -------------------------------------------------------------------- |
    | API-regio               | `https://api.moonshot.ai/v1` (internationaal) of `https://api.moonshot.cn/v1` (China) |
    | Model voor webzoekopdrachten | Standaard `kimi-k2.6`                                            |

  </Step>
</Steps>

De configuratie bevindt zich onder `plugins.entries.moonshot.config.webSearch`:

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
  <Accordion title="Systeemeigen redeneermodus">
    Kimi K2.7 Code gebruikt altijd systeemeigen redeneren. Moonshot vereist dat clients het veld `thinking` voor dit model weglaten. Daarom stelt OpenClaw alleen `on` beschikbaar en negeert het verouderde instellingen met `off`. K2.7 legt ook `temperature`, `top_p`, `n`, `presence_penalty` en `frequency_penalty` vast; OpenClaw laat geconfigureerde overschrijvingen voor deze velden weg.

    Andere Kimi-modellen van Moonshot ondersteunen binair systeemeigen redeneren:

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

    OpenClaw wijst tijdens runtime `/think`-niveaus voor deze modellen als volgt toe:

    | `/think`-niveau       | Gedrag van Moonshot        |
    | --------------------- | -------------------------- |
    | `/think off`          | `thinking.type=disabled`   |
    | Elk niveau behalve uit | `thinking.type=enabled`   |

    <Warning>
    Wanneer redeneren van Moonshot is ingeschakeld, moet `tool_choice` `auto` of `none` zijn. Een vastgelegde gereedschapskeuze (`type: "tool"` of `type: "function"`) zet redeneren in plaats daarvan terug naar `disabled`, zodat het gevraagde gereedschap alsnog wordt uitgevoerd; `tool_choice: "required"` wordt in plaats daarvan genormaliseerd naar `auto`. Dit geldt voor elk Moonshot-model behalve Kimi K2.7 Code, waarvan de redeneermodus niet kan worden uitgeschakeld. De waarde van `tool_choice` wordt voor dat model bij incompatibiliteit genormaliseerd naar `auto`.
    </Warning>

    Kimi K2.6 accepteert ook een optioneel veld `thinking.keep` dat het behoud van `reasoning_content` over meerdere beurten bepaalt. Stel dit in op `"all"` om de volledige redenering tussen beurten te behouden; laat het weg (of laat het `null`) om de standaardstrategie van de server te gebruiken. OpenClaw stuurt `thinking.keep` alleen door voor `moonshot/kimi-k2.6` en verwijdert het voor andere modellen. Kimi K2.7 Code behoudt standaard de volledige redeneringsgeschiedenis, terwijl OpenClaw het volledige veld `thinking` weglaat.

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
    Moonshot Kimi levert systeemeigen tool_call-id's met de vorm `functions.<name>:<index>`. OpenClaw behoudt het eerste voorkomen van elke systeemeigen Kimi-id en herschrijft latere duplicaten naar deterministische id's in OpenAI-stijl met `call_*`. Overeenkomende toolresultaten worden opnieuw toegewezen met dezelfde id, zodat herhaling uniek blijft zonder de eerste systeemeigen id van Kimi te verwijderen. Dit gedrag is ingebouwd in de meegeleverde Moonshot-provider en is geen door de gebruiker configureerbare instelling.
  </Accordion>

  <Accordion title="Compatibiliteit van streaminggebruik">
    Systeemeigen Moonshot-eindpunten (`https://api.moonshot.ai/v1` en
    `https://api.moonshot.cn/v1`) geven aan compatibel te zijn met streaminggebruik.
    OpenClaw baseert dit op de host van het eindpunt, niet op de provider-id, zodat een aangepaste
    provider-id die naar dezelfde systeemeigen Moonshot-host verwijst hetzelfde
    gedrag voor streaminggebruik overneemt.

    Met de K2.6-prijzen uit de catalogus wordt gestreamd gebruik dat invoer-, uitvoer-
    en cacheleestokens bevat ook omgezet in lokaal geschatte kosten in USD voor
    `/status`, `/usage full`, `/usage cost` en op transcripties gebaseerde
    sessieboekhouding.

  </Accordion>

  <Accordion title="Overzicht van eindpunten en modelreferenties">
    | Provider   | Voorvoegsel modelreferentie | Eindpunt                       | Omgevingsvariabele voor authenticatie |
    | ---------- | ---------------------------- | ------------------------------ | -------------------------------------- |
    | Moonshot   | `moonshot/`                  | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                     |
    | Moonshot CN| `moonshot/`                  | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                     |
    | Kimi Coding| `kimi/`                      | Kimi Coding-eindpunt           | `KIMI_API_KEY`                         |
    | Zoeken op het web | N.v.t.                | Hetzelfde als de Moonshot API-regio | `KIMI_API_KEY` of `MOONSHOT_API_KEY` |

    - Kimi-webzoekopdrachten gebruiken `KIMI_API_KEY` of `MOONSHOT_API_KEY` en gebruiken standaard `https://api.moonshot.ai/v1` met model `kimi-k2.6`.
    - Overschrijf indien nodig prijs- en contextmetagegevens in `models.providers`.
    - Als Moonshot andere contextlimieten voor een model publiceert, pas `contextWindow` dan dienovereenkomstig aan.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Zoeken op het web" href="/nl/tools/web" icon="magnifying-glass">
    Providers voor zoeken op het web configureren, waaronder Kimi.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema voor providers, modellen en plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Beheer en documentatie van Moonshot API-sleutels.
  </Card>
</CardGroup>
