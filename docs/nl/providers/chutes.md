---
read_when:
    - Je wilt Chutes gebruiken met OpenClaw
    - Je hebt het OAuth- of API-sleutelconfiguratiepad nodig
    - U wilt het standaardmodel, aliassen of detectiegedrag
summary: Chutes-configuratie (OAuth of API-sleutel, modeldetectie, aliassen)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T09:18:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) biedt catalogi met opensourcemodellen aan via een
OpenAI-compatibele API. OpenClaw ondersteunt zowel OAuth via de browser als authenticatie met een API-sleutel.

| Eigenschap       | Waarde                                                  |
| ---------------- | ------------------------------------------------------- |
| Provider         | `chutes`                                                |
| Plugin           | officieel extern pakket (`@openclaw/chutes-provider`)   |
| API              | OpenAI-compatibel                                       |
| Basis-URL        | `https://llm.chutes.ai/v1`                              |
| Authenticatie    | OAuth of API-sleutel (zie hieronder)                    |
| Runtime-omgevingsvariabelen | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`        |

`CHUTES_OAUTH_TOKEN` levert rechtstreeks een reeds verkregen OAuth-toegangstoken
(bijvoorbeeld in CI), waarbij de onderstaande interactieve browserstroom wordt overgeslagen.

## Plugin installeren

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Aan de slag

Beide methoden stellen het standaardmodel in op `chutes/zai-org/GLM-4.7-TEE` en registreren
de Chutes-catalogus.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Voer de OAuth-onboardingstroom uit">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw start de browserstroom lokaal of toont op externe hosts/hosts zonder grafische interface
        een URL en een stroom waarbij de omleiding wordt geplakt. OAuth-tokens worden automatisch vernieuwd via de
        authenticatieprofielen van OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-sleutel">
    <Steps>
      <Step title="Verkrijg een API-sleutel">
        Maak een sleutel aan op
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Voer de onboardingstroom voor de API-sleutel uit">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Detectiegedrag

Wanneer Chutes-authenticatie beschikbaar is, bevraagt OpenClaw `GET /v1/models` met die
referentie en gebruikt het de gedetecteerde modellen, die per referentie 5 minuten in de cache
worden bewaard. Bij een verlopen/niet-geautoriseerde sleutel (HTTP 401) probeert OpenClaw het eenmaal opnieuw
zonder referenties. Als de detectie nog steeds geen rijen retourneert, mislukt of een
andere niet-2xx-status retourneert, valt het terug op de meegeleverde statische catalogus (detectie met zowel een API-sleutel
als OAuth gebruikt hetzelfde pad). Als de detectie bij het opstarten mislukt, wordt
de statische catalogus automatisch gebruikt.

## Standaardaliassen

OpenClaw registreert drie handige aliassen voor de Chutes-catalogus:

| Alias           | Doelmodel                                             |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Ingebouwde startcatalogus

De meegeleverde reservecatalogus bevat 47 modellen. Een representatieve selectie van de huidige referenties:

| Modelreferentie                                      |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Voer `openclaw models list --all --provider chutes` uit voor de volledige lijst.

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
  <Accordion title="OAuth-aanpassingen">
    Pas de OAuth-stroom aan met optionele omgevingsvariabelen:

    | Variabele | Doel |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth-client-id (er wordt om gevraagd als deze niet is ingesteld) |
    | `CHUTES_CLIENT_SECRET` | OAuth-clientgeheim |
    | `CHUTES_OAUTH_REDIRECT_URI` | Omleidings-URI (standaard `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Door spaties gescheiden bereiken (standaard `openid profile chutes:invoke`) |

    Raadpleeg de [OAuth-documentatie van Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    voor vereisten voor omleidingsapps en hulp.

  </Accordion>

  <Accordion title="Opmerkingen">
    - Chutes-modellen worden geregistreerd als `chutes/<model-id>`.
    - Chutes rapporteert tijdens het streamen geen tokengebruik (`supportsUsageInStreaming: false`); de gebruikstotalen worden alsnog weergegeven zodra de stream is voltooid.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providerregels, modelreferenties en failovergedrag.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema, inclusief providerinstellingen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-dashboard en API-documentatie.
  </Card>
  <Card title="Chutes API-sleutels" href="https://chutes.ai/settings/api-keys" icon="key">
    Maak Chutes API-sleutels aan en beheer ze.
  </Card>
</CardGroup>
