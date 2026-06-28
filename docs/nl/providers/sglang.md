---
read_when:
    - Je wilt OpenClaw gebruiken met een lokale SGLang-server
    - Je wilt OpenAI-compatibele /v1-eindpunten met je eigen modellen
summary: OpenClaw uitvoeren met SGLang (OpenAI-compatibele zelfgehoste server)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SGLang serveert open-weightmodellen via een OpenAI-compatibele HTTP-API. OpenClaw maakt verbinding met SGLang met de providerfamilie `openai-completions` en autodetectie van beschikbare modellen.

| Eigenschap                | Waarde                                                       |
| ------------------------- | ------------------------------------------------------------ |
| Provider-id               | `sglang`                                                     |
| Plugin                    | gebundeld, `enabledByDefault: true`                          |
| Auth-env-var              | `SGLANG_API_KEY` (elke niet-lege waarde als de server geen auth heeft) |
| Onboardingvlag            | `--auth-choice sglang`                                       |
| API                       | OpenAI-compatibel (`openai-completions`)                     |
| Standaardbasis-URL        | `http://127.0.0.1:30000/v1`                                  |
| Standaardmodel-placeholder | `sglang/Qwen/Qwen3-8B`                                      |
| Streaminggebruik          | Ja (`supportsStreamingUsage: true`)                          |
| Prijzen                   | Gemarkeerd als extern-gratis (`modelPricing.external: false`) |

OpenClaw detecteert ook **automatisch** beschikbare modellen van SGLang wanneer je je aanmeldt met `SGLANG_API_KEY`. Gebruik `sglang/*` in `agents.defaults.models` om detectie dynamisch te houden wanneer je ook een aangepaste SGLang-basis-URL configureert. Zie [Modeldetectie (impliciete provider)](#model-discovery-implicit-provider) hieronder.

## Aan de slag

<Steps>
  <Step title="Start SGLang">
    Start SGLang met een OpenAI-compatibele server. Je basis-URL moet
    `/v1`-endpoints beschikbaar maken (bijvoorbeeld `/v1/models`, `/v1/chat/completions`). SGLang
    draait vaak op:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Stel een API-sleutel in">
    Elke waarde werkt als er geen auth op je server is geconfigureerd:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Voer onboarding uit of stel direct een model in">
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

Wanneer `SGLANG_API_KEY` is ingesteld (of er een auth-profiel bestaat) en je
`models.providers.sglang` **niet** definieert, vraagt OpenClaw het volgende op:

- `GET http://127.0.0.1:30000/v1/models`

en zet de geretourneerde ID's om in modelvermeldingen.

<Note>
Als je `models.providers.sglang` expliciet instelt, gebruikt OpenClaw standaard
je opgegeven modellen. Voeg `"sglang/*": {}` toe aan `agents.defaults.models` wanneer je
wilt dat OpenClaw het `/models`-endpoint van die geconfigureerde provider opvraagt en
alle geadverteerde SGLang-modellen opneemt.
</Note>

## Expliciete configuratie (handmatige modellen)

Gebruik expliciete configuratie wanneer:

- SGLang op een andere host/poort draait.
- Je `contextWindow`/`maxTokens`-waarden wilt vastzetten.
- Je server een echte API-sleutel vereist (of je headers wilt beheren).

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
            name: "Local SGLang Model",
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
  <Accordion title="Proxy-achtig gedrag">
    SGLang wordt behandeld als een proxy-achtige OpenAI-compatibele `/v1`-backend, niet als een
    native OpenAI-endpoint.

    | Gedrag | SGLang |
    |----------|--------|
    | OpenAI-only request shaping | Niet toegepast |
    | `service_tier`, Responses `store`, prompt-cache hints | Niet verzonden |
    | Reasoning-compat payload shaping | Niet toegepast |
    | Verborgen attributieheaders (`originator`, `version`, `User-Agent`) | Niet geïnjecteerd op aangepaste SGLang-basis-URL's |

  </Accordion>

  <Accordion title="Probleemoplossing">
    **Server niet bereikbaar**

    Controleer of de server draait en reageert:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Auth-fouten**

    Als aanvragen mislukken met auth-fouten, stel dan een echte `SGLANG_API_KEY` in die overeenkomt
    met je serverconfiguratie, of configureer de provider expliciet onder
    `models.providers.sglang`.

    <Tip>
    Als je SGLang zonder authenticatie uitvoert, is elke niet-lege waarde voor
    `SGLANG_API_KEY` voldoende om je aan te melden voor modeldetectie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief providervermeldingen.
  </Card>
</CardGroup>
