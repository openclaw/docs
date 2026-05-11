---
read_when:
    - Je wilt door Bedrock Mantle gehoste OSS-modellen gebruiken met OpenClaw
    - Je hebt het OpenAI-compatibele Mantle-eindpunt nodig voor GPT-OSS, Qwen, Kimi of GLM
summary: Gebruik Amazon Bedrock Mantle-modellen (OpenAI-compatibel) met OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-11T20:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw bevat een gebundelde **Amazon Bedrock Mantle**-provider die verbinding maakt met
het OpenAI-compatibele Mantle-eindpunt. Mantle host open-source- en
externe modellen (GPT-OSS, Qwen, Kimi, GLM en vergelijkbare) via een standaard
`/v1/chat/completions`-surface, ondersteund door Bedrock-infrastructuur.

| Eigenschap      | Waarde                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Provider-ID     | `amazon-bedrock-mantle`                                                                          |
| API             | `openai-completions` (OpenAI-compatibel) of `anthropic-messages` (Anthropic Messages-route)      |
| Authenticatie   | Expliciete `AWS_BEARER_TOKEN_BEDROCK` of bearer-token-generatie via IAM-credentialketen          |
| Standaardregio  | `us-east-1` (overschrijven met `AWS_REGION` of `AWS_DEFAULT_REGION`)                             |

## Aan de slag

Kies je gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="Expliciet bearer-token">
    **Het meest geschikt voor:** omgevingen waarin je al een Mantle bearer-token hebt.

    <Steps>
      <Step title="Stel het bearer-token in op de Gateway-host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Stel eventueel een regio in (standaard `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Controleer of modellen worden ontdekt">
        ```bash
        openclaw models list
        ```

        Ontdekte modellen verschijnen onder de provider `amazon-bedrock-mantle`. Er is geen
        aanvullende configuratie vereist, tenzij je standaardwaarden wilt overschrijven.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-credentials">
    **Het meest geschikt voor:** gebruik van AWS SDK-compatibele credentials (gedeelde configuratie, SSO, webidentiteit, instance- of taakrollen).

    <Steps>
      <Step title="Configureer AWS-credentials op de Gateway-host">
        Elke AWS SDK-compatibele authenticatiebron werkt:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Controleer of modellen worden ontdekt">
        ```bash
        openclaw models list
        ```

        OpenClaw genereert automatisch een Mantle bearer-token vanuit de credentialketen.
      </Step>
    </Steps>

    <Tip>
    Wanneer `AWS_BEARER_TOKEN_BEDROCK` niet is ingesteld, maakt OpenClaw het bearer-token voor je aan vanuit de standaard AWS-credentialketen, inclusief gedeelde credentials/configuratieprofielen, SSO, webidentiteit en instance- of taakrollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische modeldetectie

Wanneer `AWS_BEARER_TOKEN_BEDROCK` is ingesteld, gebruikt OpenClaw het direct. Anders
probeert OpenClaw een Mantle bearer-token te genereren vanuit de standaard
AWS-credentialketen. Daarna worden beschikbare Mantle-modellen ontdekt door het
`/v1/models`-eindpunt van de regio op te vragen.

| Gedrag           | Detail                         |
| ---------------- | ------------------------------ |
| Detectiecache    | Resultaten 1 uur gecachet      |
| IAM-tokenverversing | Elk uur                      |

Als je de Mantle-Plugin ingeschakeld wilt houden maar automatische detectie en IAM
bearer-token-generatie wilt onderdrukken, schakel je de detectieschakelaar van de Plugin uit:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Het bearer-token is hetzelfde `AWS_BEARER_TOKEN_BEDROCK` dat wordt gebruikt door de standaard [Amazon Bedrock](/nl/providers/bedrock)-provider.
</Note>

### Ondersteunde regio’s

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
  <Accordion title="Ondersteuning voor reasoning">
    Ondersteuning voor reasoning wordt afgeleid uit model-ID’s die patronen bevatten zoals
    `thinking`, `reasoner` of `gpt-oss-120b`. OpenClaw stelt tijdens detectie automatisch
    `reasoning: true` in voor overeenkomende modellen.
  </Accordion>

  <Accordion title="Niet-beschikbaarheid van eindpunt">
    Als het Mantle-eindpunt niet beschikbaar is of geen modellen retourneert, wordt de provider
    stilzwijgend overgeslagen. OpenClaw geeft geen fout; andere geconfigureerde providers
    blijven normaal werken.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via de Anthropic Messages-route">
    Mantle biedt ook een Anthropic Messages-route die Claude-modellen via hetzelfde met bearer-authenticatie beveiligde streamingpad doorgeeft. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) kan via deze route worden aangeroepen met streaming die eigendom is van de provider, zodat AWS bearer-tokens niet worden behandeld als Anthropic API-sleutels.

    Wanneer je een Anthropic Messages-model vastzet op de Mantle-provider, gebruikt OpenClaw voor dat model de `anthropic-messages`-API-surface in plaats van `openai-completions`. Authenticatie komt nog steeds van `AWS_BEARER_TOKEN_BEDROCK` (of het aangemaakte IAM bearer-token).

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

  <Accordion title="Relatie tot de Amazon Bedrock-provider">
    Bedrock Mantle is een afzonderlijke provider naast de standaard
    [Amazon Bedrock](/nl/providers/bedrock)-provider. Mantle gebruikt een
    OpenAI-compatibele `/v1`-surface, terwijl de standaard Bedrock-provider de
    native Bedrock-API gebruikt.

    Beide providers delen dezelfde `AWS_BEARER_TOKEN_BEDROCK`-credential wanneer
    deze aanwezig is.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/nl/providers/bedrock" icon="cloud">
    Native Bedrock-provider voor Anthropic Claude, Titan en andere modellen.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failover-gedrag kiezen.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiedetails en regels voor hergebruik van credentials.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en hoe je ze oplost.
  </Card>
</CardGroup>
