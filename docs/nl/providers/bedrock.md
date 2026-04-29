---
read_when:
    - Je wilt Amazon Bedrock-modellen gebruiken met OpenClaw
    - Voor modelaanroepen moet je AWS-referentiegegevens en een regio configureren.
summary: Amazon Bedrock-modellen (Converse API) gebruiken met OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-29T23:08:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kan **Amazon Bedrock**-modellen gebruiken via pi-ai's **Bedrock Converse**
streamingprovider. Bedrock-authenticatie gebruikt de **standaard credentialketen van de AWS SDK**,
niet een API-sleutel.

| Eigenschap | Waarde                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Auth     | AWS-credentials (env-vars, gedeelde config of instantierol) |
| Regio   | `AWS_REGION` of `AWS_DEFAULT_REGION` (standaard: `us-east-1`) |

## Aan de slag

Kies je voorkeursmethode voor authenticatie en volg de installatiestappen.

<Tabs>
  <Tab title="Access keys / env vars">
    **Beste voor:** ontwikkelaarsmachines, CI of hosts waar je AWS-credentials rechtstreeks beheert.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        Er is geen `apiKey` vereist. Configureer de provider met `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Met env-marker-authenticatie (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` of `AWS_BEARER_TOKEN_BEDROCK`) schakelt OpenClaw de impliciete Bedrock-provider automatisch in voor modeldetectie zonder extra config.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Beste voor:** EC2-instanties waaraan een IAM-rol is gekoppeld, met gebruik van de instantie-metadataservice voor authenticatie.

    <Steps>
      <Step title="Enable discovery explicitly">
        Bij gebruik van IMDS kan OpenClaw AWS-authenticatie niet alleen op basis van env-markers detecteren, dus moet je expliciet deelnemen:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Als je ook wilt dat het pad voor automatische detectie via env-markers werkt (bijvoorbeeld voor `openclaw status`-oppervlakken):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Je hebt **geen** nep-API-sleutel nodig.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    De IAM-rol die aan je EC2-instantie is gekoppeld, moet de volgende machtigingen hebben:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (voor automatische detectie)
    - `bedrock:ListInferenceProfiles` (voor detectie van inferentieprofielen)

    Of koppel het beheerde beleid `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Je hebt `AWS_PROFILE=default` alleen nodig als je specifiek een env-marker voor automatische modus of statusoppervlakken wilt. Het daadwerkelijke authenticatiepad van de Bedrock-runtime gebruikt de standaardketen van de AWS SDK, dus authenticatie met IMDS-instantierol werkt zelfs zonder env-markers.
    </Note>

  </Tab>
</Tabs>

## Automatische modeldetectie

OpenClaw kan automatisch Bedrock-modellen detecteren die **streaming**
en **tekstuitvoer** ondersteunen. Detectie gebruikt `bedrock:ListFoundationModels` en
`bedrock:ListInferenceProfiles`, en resultaten worden gecachet (standaard: 1 uur).

Hoe de impliciete provider wordt ingeschakeld:

- Als `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` is,
  probeert OpenClaw detectie zelfs wanneer er geen AWS-env-marker aanwezig is.
- Als `plugins.entries.amazon-bedrock.config.discovery.enabled` niet is ingesteld,
  voegt OpenClaw de
  impliciete Bedrock-provider alleen automatisch toe wanneer het een van deze AWS-auth-markers ziet:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` of `AWS_PROFILE`.
- Het daadwerkelijke authenticatiepad van de Bedrock-runtime gebruikt nog steeds de standaardketen van de AWS SDK, zodat
  gedeelde config, SSO en authenticatie via IMDS-instantierollen kunnen werken, zelfs wanneer detectie
  `enabled: true` nodig had om expliciet deel te nemen.

<Note>
Voor expliciete `models.providers["amazon-bedrock"]`-items kan OpenClaw Bedrock-env-marker-authenticatie nog steeds vroeg oplossen vanuit AWS-env-markers zoals `AWS_BEARER_TOKEN_BEDROCK` zonder volledige runtime-authenticatielading af te dwingen. Het daadwerkelijke authenticatiepad voor modelaanroepen gebruikt nog steeds de standaardketen van de AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Configopties staan onder `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Optie | Standaard | Beschrijving |
    | ------ | ------- | ----------- |
    | `enabled` | auto | In automatische modus schakelt OpenClaw de impliciete Bedrock-provider alleen in wanneer het een ondersteunde AWS-env-marker ziet. Stel in op `true` om detectie af te dwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-regio die wordt gebruikt voor detectie-API-aanroepen. |
    | `providerFilter` | (alle) | Komt overeen met namen van Bedrock-providers (bijvoorbeeld `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cacheduur in seconden. Stel in op `0` om caching uit te schakelen. |
    | `defaultContextWindow` | `32000` | Contextvenster dat wordt gebruikt voor gedetecteerde modellen (overschrijf dit als je de limieten van je model kent). |
    | `defaultMaxTokens` | `4096` | Maximaal aantal uitvoertokens dat wordt gebruikt voor gedetecteerde modellen (overschrijf dit als je de limieten van je model kent). |

  </Accordion>
</AccordionGroup>

## Snelle installatie (AWS-pad)

Deze walkthrough maakt een IAM-rol aan, koppelt Bedrock-machtigingen, associeert
het instantieprofiel en schakelt OpenClaw-detectie in op de EC2-host.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw detecteert **regionale en globale inferentieprofielen** naast
    foundation-modellen. Wanneer een profiel is gekoppeld aan een bekend foundation-model, erft het
    profiel de mogelijkheden van dat model (contextvenster, maximale tokens,
    redeneren, vision) en wordt de juiste Bedrock-aanvraagregio automatisch
    geïnjecteerd. Dit betekent dat cross-region Claude-profielen werken zonder handmatige
    provider-overschrijvingen.

    Inferentieprofiel-ID's zien eruit als `us.anthropic.claude-opus-4-6-v1:0` (regionaal)
    of `anthropic.claude-opus-4-6-v1:0` (globaal). Als het onderliggende model al
    in de detectieresultaten staat, erft het profiel de volledige set mogelijkheden;
    anders gelden veilige standaardwaarden.

    Er is geen extra configuratie nodig. Zolang detectie is ingeschakeld en de IAM-
    principal `bedrock:ListInferenceProfiles` heeft, verschijnen profielen naast
    foundation-modellen in `openclaw models list`.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock weigert de parameter `temperature` voor Claude Opus 4.7. OpenClaw
    laat `temperature` automatisch weg voor elke Opus 4.7-Bedrock-ref, inclusief
    foundation-model-ID's, benoemde inferentieprofielen, applicatie-inferentieprofielen
    waarvan het onderliggende model via `bedrock:GetInferenceProfile` naar Opus 4.7 wordt herleid,
    en gestippelde `opus-4.7`-varianten met
    optionele regiovoorvoegsels (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Er is geen configknop vereist, en het weglaten geldt voor zowel
    het aanvraagoptiesobject als het payloadveld `inferenceConfig`.
  </Accordion>

  <Accordion title="Guardrails">
    Je kunt [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    toepassen op alle Bedrock-modelaanroepen door een `guardrail`-object toe te voegen aan de
    `amazon-bedrock`-Plugin-config. Guardrails laten je contentfiltering,
    onderwerpweigering, woordfilters, filters voor gevoelige informatie en contextuele
    groundingcontroles afdwingen.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Optie | Vereist | Beschrijving |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Ja | Guardrail-ID (bijv. `abc123`) of volledige ARN (bijv. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ja | Gepubliceerd versienummer, of `"DRAFT"` voor het werkconcept. |
    | `streamProcessingMode` | Nee | `"sync"` of `"async"` voor guardrail-evaluatie tijdens streaming. Als dit wordt weggelaten, gebruikt Bedrock de standaardwaarde. |
    | `trace` | Nee | `"enabled"` of `"enabled_full"` voor debugging; laat weg of stel in op `"disabled"` voor productie. |

    <Warning>
    De IAM-principal die door de Gateway wordt gebruikt, moet naast de standaard aanroepmachtigingen ook de machtiging `bedrock:ApplyGuardrail` hebben.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings voor geheugenzoekopdrachten">
    Bedrock kan ook dienen als de embeddingprovider voor
    [geheugenzoekopdrachten](/nl/concepts/memory-search). Dit wordt apart geconfigureerd van de
    inferentieprovider -- stel `agents.defaults.memorySearch.provider` in op `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Bedrock-embeddings gebruiken dezelfde AWS SDK-referentieketen als inferentie (instantie-
    rollen, SSO, toegangssleutels, gedeelde configuratie en webidentiteit). Er is geen API-sleutel
    nodig. Wanneer `provider` `"auto"` is, wordt Bedrock automatisch gedetecteerd als die
    referentieketen succesvol wordt herleid.

    Ondersteunde embeddingmodellen zijn onder andere Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) en TwelveLabs Marengo. Zie
    [Referentie voor geheugenconfiguratie -- Bedrock](/nl/reference/memory-config#bedrock-embedding-config)
    voor de volledige modellijst en dimensieopties.

  </Accordion>

  <Accordion title="Opmerkingen en kanttekeningen">
    - Bedrock vereist dat **modeltoegang** is ingeschakeld in je AWS-account/regio.
    - Automatische detectie vereist de machtigingen `bedrock:ListFoundationModels` en
      `bedrock:ListInferenceProfiles`.
    - Als je op de automatische modus vertrouwt, stel dan een van de ondersteunde AWS-auth-env-markeringen in op de
      Gateway-host. Als je IMDS/gedeelde-configuratie-auth zonder env-markeringen verkiest, stel dan
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` in.
    - OpenClaw toont de referentiebron in deze volgorde: `AWS_BEARER_TOKEN_BEDROCK`,
      daarna `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, daarna `AWS_PROFILE`, daarna de
      standaard AWS SDK-keten.
    - Ondersteuning voor redeneren hangt af van het model; raadpleeg de Bedrock-modelkaart voor
      de huidige mogelijkheden.
    - Als je de voorkeur geeft aan een beheerde sleutelstroom, kun je ook een OpenAI-compatibele
      proxy voor Bedrock plaatsen en deze in plaats daarvan configureren als OpenAI-provider.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Geheugenzoekopdrachten" href="/nl/concepts/memory-search" icon="magnifying-glass">
    Bedrock-embeddings voor configuratie van geheugenzoekopdrachten.
  </Card>
  <Card title="Referentie voor geheugenconfiguratie" href="/nl/reference/memory-config#bedrock-embedding-config" icon="database">
    Volledige lijst met Bedrock-embeddingmodellen en dimensieopties.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
