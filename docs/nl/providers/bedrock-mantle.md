---
read_when:
    - Je wilt door Bedrock Mantle gehoste OSS-modellen gebruiken met OpenClaw
    - Je hebt het OpenAI-compatibele Mantle-eindpunt nodig voor GPT-OSS, Qwen, Kimi of GLM
    - Je wilt Claude Sonnet 5 of Mythos 5 gebruiken via Amazon Bedrock Mantle
summary: Gebruik Amazon Bedrock Mantle-modellen die compatibel zijn met OpenAI en Claude Messages-modellen met OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T09:17:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw bevat een meegeleverde **Amazon Bedrock Mantle**-provider die verbinding maakt met
het OpenAI-compatibele Mantle-eindpunt. Mantle host opensource- en
modellen van derden (GPT-OSS, Qwen, Kimi, GLM en vergelijkbare modellen) via een standaard
`/v1/chat/completions`-interface die wordt ondersteund door de Bedrock-infrastructuur. Mantle stelt ook
Anthropic Claude-modellen beschikbaar via een Anthropic Messages-route.

| Eigenschap       | Waarde                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Provider-ID    | `amazon-bedrock-mantle`                                                                |
| API            | `openai-completions` voor gedetecteerde OSS-modellen, `anthropic-messages` voor Claude-modellen |
| Authenticatie           | Expliciete `AWS_BEARER_TOKEN_BEDROCK` of het genereren van een bearertoken via de IAM-referentieketen    |
| Standaardregio | `us-east-1` (overschrijven met `AWS_REGION` of `AWS_DEFAULT_REGION`)                       |

## Aan de slag

Kies de gewenste authenticatiemethode en volg de configuratiestappen.

<Tabs>
  <Tab title="Expliciet bearertoken">
    **Het meest geschikt voor:** omgevingen waarin u al een Mantle-bearertoken hebt.

    <Steps>
      <Step title="Stel het bearertoken in op de Gateway-host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Stel desgewenst een regio in (standaard `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Controleer of modellen worden gedetecteerd">
        ```bash
        openclaw models list
        ```

        Gedetecteerde modellen worden weergegeven onder de provider `amazon-bedrock-mantle`. Er is geen
        aanvullende configuratie vereist, tenzij u de standaardwaarden wilt overschrijven.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-referenties">
    **Het meest geschikt voor:** het gebruik van AWS SDK-compatibele referenties (gedeelde configuratie, SSO, webidentiteit, instantie- of taakrollen).

    <Steps>
      <Step title="Configureer AWS-referenties op de Gateway-host">
        Elke AWS SDK-compatibele authenticatiebron werkt:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Controleer of modellen worden gedetecteerd">
        ```bash
        openclaw models list
        ```

        OpenClaw genereert automatisch een Mantle-bearertoken uit de referentieketen.
      </Step>
    </Steps>

    <Tip>
    Wanneer `AWS_BEARER_TOKEN_BEDROCK` niet is ingesteld, maakt OpenClaw het bearertoken voor u aan vanuit de standaardreferentieketen van AWS, waaronder gedeelde referenties/configuratieprofielen, SSO, webidentiteit en instantie- of taakrollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische modeldetectie

Wanneer `AWS_BEARER_TOKEN_BEDROCK` is ingesteld, gebruikt OpenClaw dit rechtstreeks. Anders
probeert OpenClaw een Mantle-bearertoken te genereren vanuit de standaardreferentieketen
van AWS. Vervolgens detecteert het beschikbare Mantle-modellen door het
`/v1/models`-eindpunt van de regio op te vragen.

| Gedrag          | Details                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| Detectiecache   | Resultaten worden per regio 1 uur gecachet; bij een ophaalfout wordt het laatst gecachete resultaat geretourneerd |
| Vernieuwing van IAM-token | Elke 2 uur, per regio gecachet                                                     |

Als u de Mantle-Plugin ingeschakeld wilt houden maar automatische detectie en het genereren
van IAM-bearertokens wilt onderdrukken, schakelt u de detectieschakelaar van de Plugin uit:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Het bearertoken is dezelfde `AWS_BEARER_TOKEN_BEDROCK` die door de standaardprovider [Amazon Bedrock](/nl/providers/bedrock) wordt gebruikt.
</Note>

### Ondersteunde regio's

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Handmatige configuratie

Als u expliciete configuratie verkiest boven automatische detectie:

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

Een expliciete, niet-lege `models`-lijst is bepalend en vervangt elke
gedetecteerde rij, inclusief de Claude-rijen hieronder. Laat `models` weg om de
automatische Mantle-catalogus te behouden, of neem de volledige Claude-modelvermeldingen op die u
wilt gebruiken.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Ondersteuning voor redeneren">
    Ondersteuning voor redeneren wordt afgeleid uit model-ID's die patronen bevatten zoals
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` of
    `gpt-oss-safeguard-120b`. OpenClaw stelt tijdens de detectie automatisch
    `reasoning: true` in voor overeenkomende modellen.
  </Accordion>

  <Accordion title="Onbeschikbaarheid van het eindpunt">
    Als het Mantle-eindpunt niet beschikbaar is, geen modellen retourneert of het
    bepalen van het bearertoken mislukt, retourneert de detectie een leeg resultaat en wordt de impliciete
    provider overgeslagen. OpenClaw geeft geen foutmelding; andere geconfigureerde providers
    blijven normaal functioneren.
  </Accordion>

  <Accordion title="Claude via de Anthropic Messages-route">
    Wanneer automatische detectie de modellenlijst beheert, voegt OpenClaw na een geslaagde
    zoekactie vier Claude-modellen toe, ongeacht wat `/v1/models` retourneert:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) en
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), plus
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Ze gebruiken de `anthropic-messages`-API-interface en streamen via
    hetzelfde met een bearertoken geauthenticeerde, Anthropic-compatibele eindpunt
    (`<mantle-base>/anthropic`), zodat het AWS-bearertoken niet als een
    Anthropic-API-sleutel wordt behandeld.

    Claude Sonnet 5 gebruikt altijd adaptief denken en hanteert standaard een `high`
    inspanningsniveau. `/think off` en `/think minimal` worden toegewezen aan `low`, omdat de Mantle-route
    denken niet kan uitschakelen. OpenClaw laat ook een aangepaste temperatuur weg voor
    Sonnet 5-aanvragen.

    Claude Mythos 5 heeft beperkte toegang. Het biedt een contextvenster van 1.000.000 tokens
    en een uitvoerlimiet van 128.000 tokens, gebruikt altijd adaptief denken, wijst
    `/think off` en `/think minimal` toe aan `low` en laat door de aanroeper geselecteerde
    bemonsteringsparameters weg.

    Claude Mythos Preview vraagt altijd om redeneren en gebruikt standaard een `high`
    inspanningsniveau wanneer geen `/think`-niveau is ingesteld (`xhigh`/`max` wordt verlaagd naar
    `high` en `minimal` verhoogd naar `low`). Opus 4.7 op Mantle streamt zonder
    door het model aangeleverde redenering en OpenClaw laat de parameter `temperature`
    weg, omdat Opus 4.7 op deze route geen overschrijvingen voor bemonstering accepteert; Mythos
    Preview accepteert normaal een overschrijving voor `temperature`.

    Een niet-lege expliciete lijst `models.providers["amazon-bedrock-mantle"].models`
    vervangt de volledige gedetecteerde catalogus. Laat die lijst weg wanneer u
    deze ingebouwde Claude-rijen wilt gebruiken.

  </Accordion>

  <Accordion title="Relatie met de Amazon Bedrock-provider">
    Bedrock Mantle is een afzonderlijke provider ten opzichte van de standaardprovider
    [Amazon Bedrock](/nl/providers/bedrock). Mantle gebruikt een
    OpenAI-compatibele `/v1`-interface voor zijn OSS-catalogus, terwijl de standaard
    Bedrock-provider de systeemeigen Bedrock Converse-API gebruikt.

    Beide providers delen dezelfde `AWS_BEARER_TOKEN_BEDROCK`-referentie wanneer
    deze aanwezig is.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/nl/providers/bedrock" icon="cloud">
    Systeemeigen Bedrock-provider voor Anthropic Claude, Titan en andere modellen.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Details over authenticatie en regels voor hergebruik van referenties.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en hoe u ze oplost.
  </Card>
</CardGroup>
