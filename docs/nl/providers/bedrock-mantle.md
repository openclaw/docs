---
read_when:
    - U wilt door Bedrock Mantle gehoste OSS-modellen gebruiken met OpenClaw
    - Je hebt het Mantle OpenAI-compatibele eindpunt nodig voor GPT-OSS, Qwen, Kimi of GLM
summary: Amazon Bedrock Mantle-modellen (OpenAI-compatibel) gebruiken met OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw bevat een gebundelde **Amazon Bedrock Mantle**-provider die verbinding maakt met
het OpenAI-compatibele Mantle-eindpunt. Mantle host opensource- en
modellen van derden (GPT-OSS, Qwen, Kimi, GLM en vergelijkbare modellen) via een standaard
`/v1/chat/completions`-oppervlak dat wordt ondersteund door Bedrock-infrastructuur.

| Eigenschap      | Waarde                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| Provider-ID     | `amazon-bedrock-mantle`                                                                     |
| API             | `openai-completions` (OpenAI-compatibel) of `anthropic-messages` (Anthropic Messages-route) |
| Authenticatie   | Expliciete `AWS_BEARER_TOKEN_BEDROCK` of IAM-referentieketen voor bearer-token-generatie    |
| Standaardregio  | `us-east-1` (overschrijven met `AWS_REGION` of `AWS_DEFAULT_REGION`)                        |

## Aan de slag

Kies de gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="Explicit bearer token">
    **Het meest geschikt voor:** omgevingen waarin je al een Mantle-bearer-token hebt.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Stel optioneel een regio in (standaard is `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Opt in to provider data sharing for Claude Fable 5">
        Claude Fable 5 en Claude Mythos-klasse Bedrock-modellen vereisen de Mantle Data Retention API-modus `provider_data_share` vóór aanroep. Deze opt-in staat Bedrock toe prompts en completions met Anthropic te delen en ze maximaal 30 dagen te bewaren voor vertrouwens- en veiligheidsbeoordeling.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Gebruik een ander Bedrock-model in de configuratie als je die bewaarmodus niet kunt accepteren.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Ontdekte modellen verschijnen onder de provider `amazon-bedrock-mantle`. Er is geen
        aanvullende configuratie nodig, tenzij je standaardwaarden wilt overschrijven.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Het meest geschikt voor:** het gebruik van AWS SDK-compatibele referenties (gedeelde configuratie, SSO, webidentiteit, instance- of taakrollen).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Elke AWS SDK-compatibele authenticatiebron werkt:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw genereert automatisch een Mantle-bearer-token uit de referentieketen.
      </Step>
    </Steps>

    <Tip>
    Wanneer `AWS_BEARER_TOKEN_BEDROCK` niet is ingesteld, maakt OpenClaw het bearer-token voor je aan vanuit de standaard AWS-referentieketen, inclusief gedeelde referenties/configuratieprofielen, SSO, webidentiteit en instance- of taakrollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische modeldetectie

Wanneer `AWS_BEARER_TOKEN_BEDROCK` is ingesteld, gebruikt OpenClaw deze direct. Anders
probeert OpenClaw een Mantle-bearer-token te genereren vanuit de standaard
AWS-referentieketen. Vervolgens worden beschikbare Mantle-modellen ontdekt door het
`/v1/models`-eindpunt van de regio te bevragen.

| Gedrag                | Detail                          |
| --------------------- | ------------------------------- |
| Detectiecache         | Resultaten 1 uur in cache       |
| Vernieuwing IAM-token | Elk uur                         |

Om de Mantle-Plugin ingeschakeld te houden maar automatische detectie en
IAM-bearer-token-generatie te onderdrukken, schakel je de detectieschakelaar van de Plugin uit:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Het bearer-token is dezelfde `AWS_BEARER_TOKEN_BEDROCK` die wordt gebruikt door de standaardprovider [Amazon Bedrock](/nl/providers/bedrock).
</Note>

### Ondersteunde regio's

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Handmatige configuratie

Als je expliciete configuratie verkiest boven automatische detectie:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Reasoning support">
    Reasoning-ondersteuning wordt afgeleid uit model-ID's die patronen bevatten zoals
    `thinking`, `reasoner` of `gpt-oss-120b`. OpenClaw stelt `reasoning: true`
    automatisch in voor overeenkomende modellen tijdens detectie.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Als het Mantle-eindpunt niet beschikbaar is of geen modellen retourneert, wordt de provider
    stilzwijgend overgeslagen. OpenClaw geeft geen foutmelding; andere geconfigureerde providers
    blijven normaal werken.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle biedt ook een Anthropic Messages-route die Claude-modellen via hetzelfde met bearer-token geauthenticeerde streamingpad doorgeeft. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) kan via deze route worden aangeroepen met streaming die eigendom is van de provider, zodat AWS-bearer-tokens niet als Anthropic API-sleutels worden behandeld.

    Wanneer je een Anthropic Messages-model op de Mantle-provider vastzet, gebruikt OpenClaw het `anthropic-messages`-API-oppervlak in plaats van `openai-completions` voor dat model. Authenticatie komt nog steeds uit `AWS_BEARER_TOKEN_BEDROCK` (of het aangemaakte IAM-bearer-token).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle is een afzonderlijke provider naast de standaardprovider
    [Amazon Bedrock](/nl/providers/bedrock). Mantle gebruikt een
    OpenAI-compatibel `/v1`-oppervlak, terwijl de standaard Bedrock-provider
    de native Bedrock-API gebruikt.

    Beide providers delen dezelfde `AWS_BEARER_TOKEN_BEDROCK`-referentie wanneer
    die aanwezig is.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/nl/providers/bedrock" icon="cloud">
    Native Bedrock-provider voor Anthropic Claude, Titan en andere modellen.
  </Card>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="OAuth and auth" href="/nl/gateway/authentication" icon="key">
    Authenticatiegegevens en regels voor hergebruik van referenties.
  </Card>
  <Card title="Troubleshooting" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en hoe je ze oplost.
  </Card>
</CardGroup>
