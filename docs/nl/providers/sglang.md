---
read_when:
    - Je wilt OpenClaw uitvoeren met een lokale SGLang-server
    - Je wilt OpenAI-compatibele /v1-eindpunten met je eigen modellen
summary: Voer OpenClaw uit met SGLang (zelfgehoste OpenAI-compatibele server)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T09:15:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang biedt modellen met open gewichten aan via een OpenAI-compatibele HTTP-API. OpenClaw maakt verbinding met SGLang via de providerfamilie `openai-completions`, met automatische detectie van beschikbare modellen.

| Eigenschap                  | Waarde                                                               |
| --------------------------- | -------------------------------------------------------------------- |
| Provider-id                 | `sglang`                                                             |
| Plugin                      | meegeleverd, `enabledByDefault: true`                                |
| Omgevingsvariabele voor authenticatie | `SGLANG_API_KEY` (elke niet-lege waarde als de server geen authenticatie gebruikt) |
| Onboarding-vlag             | `--auth-choice sglang`                                               |
| API                         | OpenAI-compatibel (`openai-completions`)                             |
| Standaardbasis-URL          | `http://127.0.0.1:30000/v1`                                         |
| Tijdelijke aanduiding voor standaardmodel | `sglang/Qwen/Qwen3-8B`                                  |
| Streaminggebruik            | Ja (`supportsStreamingUsage: true`)                                  |
| Prijsstelling               | Gemarkeerd als extern gratis (`modelPricing.external: false`)        |

OpenClaw **detecteert ook automatisch** beschikbare modellen van SGLang wanneer u zich aanmeldt met `SGLANG_API_KEY`. Gebruik `sglang/*` in `agents.defaults.models` om de detectie dynamisch te houden wanneer u ook een aangepaste SGLang-basis-URL configureert. Zie [Modeldetectie (impliciete provider)](#model-discovery-implicit-provider) hieronder.

## Aan de slag

<Steps>
  <Step title="SGLang starten">
    Start SGLang met een OpenAI-compatibele server. Uw basis-URL moet
    `/v1`-eindpunten beschikbaar stellen (bijvoorbeeld `/v1/models`, `/v1/chat/completions`). SGLang
    draait doorgaans op:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Een API-sleutel instellen">
    Elke waarde werkt als er geen authenticatie op uw server is geconfigureerd:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding uitvoeren of rechtstreeks een model instellen">
    ```bash
    openclaw onboard
    ```

    Of configureer het model handmatig:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Modeldetectie (impliciete provider)

Wanneer `SGLANG_API_KEY` is ingesteld (of er een authenticatieprofiel bestaat) en u
`models.providers.sglang` **niet** definieert, bevraagt OpenClaw:

- `GET http://127.0.0.1:30000/v1/models`

en zet de geretourneerde id's om in modelvermeldingen.

<Note>
Als u `models.providers.sglang` expliciet instelt, gebruikt OpenClaw standaard
de door u opgegeven modellen. Voeg `"sglang/*": {}` toe aan `agents.defaults.models`
wanneer u wilt dat OpenClaw het `/models`-eindpunt van die geconfigureerde provider
bevraagt en alle aangeboden SGLang-modellen opneemt.
</Note>

## Expliciete configuratie (handmatige modellen)

Gebruik expliciete configuratie wanneer:

- SGLang op een andere host of poort draait.
- U de waarden voor `contextWindow`/`maxTokens` wilt vastzetten.
- Uw server een echte API-sleutel vereist (of u de headers wilt beheren).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Lokaal SGLang-model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Proxyachtig gedrag">
    SGLang wordt behandeld als een proxyachtige OpenAI-compatibele `/v1`-backend,
    niet als een native OpenAI-eindpunt.

    | Gedrag | SGLang |
    |--------|--------|
    | Alleen voor OpenAI bestemde verzoekaanpassing | Niet toegepast |
    | `service_tier`, `store` van Responses, aanwijzingen voor promptcaching | Niet verzonden |
    | Aanpassing van payloads voor compatibiliteit met redeneren | Niet toegepast |
    | Verborgen attributieheaders (`originator`, `version`, `User-Agent`) | Niet geïnjecteerd bij aangepaste SGLang-basis-URL's |

  </Accordion>

  <Accordion title="Problemen oplossen">
    **Server niet bereikbaar**

    Controleer of de server actief is en reageert:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Authenticatiefouten**

    Als verzoeken mislukken met authenticatiefouten, stelt u een echte
    `SGLANG_API_KEY` in die overeenkomt met uw serverconfiguratie, of configureert
    u de provider expliciet onder `models.providers.sglang`.

    <Tip>
    Als u SGLang zonder authenticatie uitvoert, volstaat elke niet-lege waarde
    voor `SGLANG_API_KEY` om modeldetectie in te schakelen.
    </Tip>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema, inclusief providervermeldingen.
  </Card>
</CardGroup>
