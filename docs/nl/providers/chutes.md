---
read_when:
    - Je wilt Chutes gebruiken met OpenClaw
    - Je hebt het configuratiepad voor OAuth of de API-sleutel nodig
    - Je wilt het standaardmodel, aliassen of ontdekkingsgedrag
summary: Chutes instellen (OAuth of API-sleutel, modeldetectie, aliassen)
title: Chutes
x-i18n:
    generated_at: "2026-04-29T23:09:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) biedt opensource-modelcatalogi aan via een
OpenAI-compatibele API. OpenClaw ondersteunt zowel browser-OAuth als directe
API-sleutel-authenticatie voor de meegeleverde `chutes`-provider.

| Eigenschap | Waarde                       |
| ---------- | ---------------------------- |
| Provider   | `chutes`                     |
| API        | OpenAI-compatibel            |
| Basis-URL  | `https://llm.chutes.ai/v1`   |
| Auth       | OAuth of API-sleutel (zie hieronder) |

## Aan de slag

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Voer de OAuth-onboardingflow uit">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw start de browserflow lokaal, of toont een URL + flow voor het
        plakken van de redirect op externe/headless hosts. OAuth-tokens worden
        automatisch vernieuwd via OpenClaw-authenticatieprofielen.
      </Step>
      <Step title="Controleer het standaardmodel">
        Na onboarding wordt het standaardmodel ingesteld op
        `chutes/zai-org/GLM-4.7-TEE` en wordt de meegeleverde Chutes-catalogus
        geregistreerd.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-sleutel">
    <Steps>
      <Step title="Haal een API-sleutel op">
        Maak een sleutel aan op
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Voer de onboardingflow voor de API-sleutel uit">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Controleer het standaardmodel">
        Na onboarding wordt het standaardmodel ingesteld op
        `chutes/zai-org/GLM-4.7-TEE` en wordt de meegeleverde Chutes-catalogus
        geregistreerd.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Beide authenticatiepaden registreren de meegeleverde Chutes-catalogus en stellen
het standaardmodel in op `chutes/zai-org/GLM-4.7-TEE`. Runtime-omgevingsvariabelen:
`CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`.
</Note>

## Detectiegedrag

Wanneer Chutes-authenticatie beschikbaar is, bevraagt OpenClaw de Chutes-catalogus
met die referentie en gebruikt het de gevonden modellen. Als detectie mislukt,
valt OpenClaw terug op een meegeleverde statische catalogus, zodat onboarding en
opstarten blijven werken.

## Standaardaliassen

OpenClaw registreert drie handige aliassen voor de meegeleverde Chutes-catalogus:

| Alias           | Doelmodel                                             |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Ingebouwde startercatalogus

De meegeleverde fallback-catalogus bevat huidige Chutes-refs:

| Model-ref                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Configuratievoorbeeld

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth-overschrijvingen">
    Je kunt de OAuth-flow aanpassen met optionele omgevingsvariabelen:

    | Variabele | Doel |
    | --------- | ---- |
    | `CHUTES_CLIENT_ID` | Aangepaste OAuth-client-ID |
    | `CHUTES_CLIENT_SECRET` | Aangepast OAuth-clientgeheim |
    | `CHUTES_OAUTH_REDIRECT_URI` | Aangepaste redirect-URI |
    | `CHUTES_OAUTH_SCOPES` | Aangepaste OAuth-scopes |

    Zie de [Chutes OAuth-documentatie](https://chutes.ai/docs/sign-in-with-chutes/overview)
    voor vereisten en hulp voor redirect-apps.

  </Accordion>

  <Accordion title="Opmerkingen">
    - API-sleutel- en OAuth-detectie gebruiken beide dezelfde provider-ID `chutes`.
    - Chutes-modellen worden geregistreerd als `chutes/<model-id>`.
    - Als detectie bij het opstarten mislukt, wordt de meegeleverde statische catalogus automatisch gebruikt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providerregels, model-refs en failovergedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema, inclusief providerinstellingen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-dashboard en API-documentatie.
  </Card>
  <Card title="Chutes API-sleutels" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API-sleutels aanmaken en beheren.
  </Card>
</CardGroup>
