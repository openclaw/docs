---
read_when:
    - Je wilt Chutes met OpenClaw gebruiken
    - Je hebt het instelpad voor OAuth of de API-sleutel nodig
    - U wilt het standaardmodel, aliassen of detectiegedrag
summary: Chutes-installatie (OAuth of API-sleutel, modeldetectie, aliassen)
title: Glijbanen
x-i18n:
    generated_at: "2026-06-27T18:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) maakt open-source modelcatalogi beschikbaar via een
OpenAI-compatibele API. OpenClaw ondersteunt zowel browser-OAuth als directe
authenticatie met API-sleutel voor de `chutes`-provider.

| Eigenschap | Waarde                       |
| ---------- | ---------------------------- |
| Provider   | `chutes`                     |
| API        | OpenAI-compatibel            |
| Basis-URL  | `https://llm.chutes.ai/v1`   |
| Auth       | OAuth of API-sleutel (zie hieronder) |

## Plugin installeren

Installeer de officiële plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Aan de slag

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="De OAuth-onboardingflow uitvoeren">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw start de browserflow lokaal, of toont een URL + doorverwijzing-plakflow
        op externe/headless hosts. OAuth-tokens worden automatisch vernieuwd via OpenClaw-auth
        profielen.
      </Step>
      <Step title="Het standaardmodel verifiëren">
        Na onboarding wordt het standaardmodel ingesteld op
        `chutes/zai-org/GLM-4.7-TEE` en wordt de statische Chutes-catalogus
        geregistreerd.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-sleutel">
    <Steps>
      <Step title="Een API-sleutel ophalen">
        Maak een sleutel aan op
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="De onboardingflow voor API-sleutels uitvoeren">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Het standaardmodel verifiëren">
        Na onboarding wordt het standaardmodel ingesteld op
        `chutes/zai-org/GLM-4.7-TEE` en wordt de statische Chutes-catalogus
        geregistreerd.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Beide authpaden registreren de statische Chutes-catalogus en stellen het standaardmodel in op
`chutes/zai-org/GLM-4.7-TEE`. Runtime-omgevingsvariabelen: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Discovery-gedrag

Wanneer Chutes-auth beschikbaar is, vraagt OpenClaw de Chutes-catalogus op met die
referentie en gebruikt het de ontdekte modellen. Als discovery mislukt, valt OpenClaw
terug op een statische catalogus, zodat onboarding en opstarten blijven werken.

## Standaardaliassen

OpenClaw registreert drie handige aliassen voor de statische Chutes-catalogus:

| Alias           | Doelmodel                                             |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Ingebouwde startercatalogus

De statische fallback-catalogus bevat actuele Chutes-refs:

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
    voor vereisten voor redirect-apps en hulp.

  </Accordion>

  <Accordion title="Opmerkingen">
    - Discovery met API-sleutel en OAuth gebruikt beide dezelfde `chutes`-provider-ID.
    - Chutes-modellen worden geregistreerd als `chutes/<model-id>`.
    - Als discovery bij het opstarten mislukt, wordt automatisch de statische catalogus gebruikt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providerregels, model-refs en failover-gedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema inclusief providerinstellingen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-dashboard en API-documentatie.
  </Card>
  <Card title="Chutes-API-sleutels" href="https://chutes.ai/settings/api-keys" icon="key">
    Maak en beheer Chutes-API-sleutels.
  </Card>
</CardGroup>
