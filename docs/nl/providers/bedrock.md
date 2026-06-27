---
read_when:
    - Je wilt Amazon Bedrock-modellen gebruiken met OpenClaw
    - Je hebt AWS-referenties/regio-instelling nodig voor modelaanroepen
summary: Amazon Bedrock-modellen (Converse API) gebruiken met OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kan **Amazon Bedrock**-modellen gebruiken via zijn **Bedrock Converse**
streamingprovider. Bedrock-authenticatie gebruikt de **standaard credential chain van de AWS SDK**,
geen API-sleutel.

| Eigenschap | Waarde                                                      |
| ---------- | ----------------------------------------------------------- |
| Provider   | `amazon-bedrock`                                            |
| API        | `bedrock-converse-stream`                                   |
| Auth       | AWS-referenties (env-vars, gedeelde config of instancerol)  |
| Regio      | `AWS_REGION` of `AWS_DEFAULT_REGION` (standaard: `us-east-1`) |

## Aan de slag

Kies je voorkeursmethode voor authenticatie en volg de installatiestappen.

<Tabs>
  <Tab title="Toegangssleutels / env-vars">
    **Beste voor:** ontwikkelmachines, CI of hosts waarop je AWS-referenties rechtstreeks beheert.

    <Steps>
      <Step title="Stel AWS-referenties in op de Gateway-host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Voeg een Bedrock-provider en -model toe aan je config">
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
      <Step title="Controleer of modellen beschikbaar zijn">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Met env-marker-authenticatie (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` of `AWS_BEARER_TOKEN_BEDROCK`) schakelt OpenClaw de impliciete Bedrock-provider automatisch in voor modelontdekking zonder extra config.
    </Tip>

  </Tab>

  <Tab title="EC2-instancerollen (IMDS)">
    **Beste voor:** EC2-instances waaraan een IAM-rol is gekoppeld, waarbij de instance metadata service voor authenticatie wordt gebruikt.

    <Steps>
      <Step title="Schakel ontdekking expliciet in">
        Bij gebruik van IMDS kan OpenClaw AWS-authenticatie niet alleen op basis van env-markers detecteren, dus je moet expliciet aanmelden:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Voeg optioneel een env-marker toe voor automatische modus">
        Als je ook wilt dat het pad voor automatische detectie via env-markers werkt (bijvoorbeeld voor `openclaw status`-oppervlakken):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Je hebt **geen** nep-API-sleutel nodig.
      </Step>
      <Step title="Controleer of modellen worden ontdekt">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    De IAM-rol die aan je EC2-instance is gekoppeld, moet de volgende machtigingen hebben:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (voor automatische ontdekking)
    - `bedrock:ListInferenceProfiles` (voor ontdekking van inferentieprofielen)

    Of koppel het beheerde beleid `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Je hebt `AWS_PROFILE=default` alleen nodig als je specifiek een env-marker voor automatische modus of statusoppervlakken wilt. Het daadwerkelijke authenticatiepad van de Bedrock-runtime gebruikt de standaard chain van de AWS SDK, dus IMDS-authenticatie via instancerol werkt ook zonder env-markers.
    </Note>

  </Tab>
</Tabs>

## Automatische modelontdekking

OpenClaw kan automatisch Bedrock-modellen ontdekken die **streaming**
en **tekstuitvoer** ondersteunen. Ontdekking gebruikt `bedrock:ListFoundationModels` en
`bedrock:ListInferenceProfiles`, en resultaten worden gecachet (standaard: 1 uur).

Hoe de impliciete provider wordt ingeschakeld:

- Als `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` is,
  probeert OpenClaw ontdekking zelfs wanneer er geen AWS-env-marker aanwezig is.
- Als `plugins.entries.amazon-bedrock.config.discovery.enabled` niet is ingesteld,
  voegt OpenClaw de
  impliciete Bedrock-provider alleen automatisch toe wanneer het een van deze AWS-auth-markers ziet:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` of `AWS_PROFILE`.
- Het daadwerkelijke authenticatiepad van de Bedrock-runtime gebruikt nog steeds de standaard chain van de AWS SDK, dus
  gedeelde config, SSO en IMDS-authenticatie via instancerol kunnen werken, ook wanneer ontdekking
  `enabled: true` nodig had om expliciet aan te melden.

<Note>
Voor expliciete `models.providers["amazon-bedrock"]`-items kan OpenClaw Bedrock-env-marker-authenticatie nog steeds vroeg oplossen vanuit AWS-env-markers zoals `AWS_BEARER_TOKEN_BEDROCK`, zonder volledige runtime-authenticatie te laden. Het daadwerkelijke authenticatiepad voor modelaanroepen gebruikt nog steeds de standaard chain van de AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Config-opties voor ontdekking">
    Config-opties staan onder `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | auto | In automatische modus schakelt OpenClaw de impliciete Bedrock-provider alleen in wanneer het een ondersteunde AWS-env-marker ziet. Stel in op `true` om ontdekking af te dwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-regio die wordt gebruikt voor API-aanroepen voor ontdekking. |
    | `providerFilter` | (alle) | Komt overeen met Bedrock-providernamen (bijvoorbeeld `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cacheduur in seconden. Stel in op `0` om caching uit te schakelen. |
    | `defaultContextWindow` | `32000` | Contextvenster dat wordt gebruikt voor ontdekte modellen (overschrijf dit als je je modellimieten kent). |
    | `defaultMaxTokens` | `4096` | Maximaal aantal uitvoertokens dat wordt gebruikt voor ontdekte modellen (overschrijf dit als je je modellimieten kent). |

  </Accordion>
</AccordionGroup>

## Snelle installatie (AWS-pad)

Deze walkthrough maakt een IAM-rol aan, koppelt Bedrock-machtigingen, associeert
het instanceprofiel en schakelt OpenClaw-ontdekking in op de EC2-host.

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
  <Accordion title="Inferentieprofielen">
    OpenClaw ontdekt **regionale en globale inferentieprofielen** naast
    foundation models. Wanneer een profiel naar een bekend foundation model verwijst, erft het
    profiel de mogelijkheden van dat model (contextvenster, max. tokens,
    reasoning, vision) en wordt de juiste Bedrock-aanvraagregio
    automatisch geïnjecteerd. Dit betekent dat Claude-profielen voor meerdere regio's werken zonder handmatige
    provider-overschrijvingen.

    Inferentieprofiel-ID's zien eruit als `us.anthropic.claude-opus-4-6-v1:0` (regionaal)
    of `anthropic.claude-opus-4-6-v1:0` (globaal). Als het onderliggende model al
    in de ontdekkingsresultaten staat, erft het profiel de volledige set mogelijkheden;
    anders worden veilige standaardwaarden toegepast.

    Er is geen extra configuratie nodig. Zolang ontdekking is ingeschakeld en de IAM-
    principal `bedrock:ListInferenceProfiles` heeft, verschijnen profielen naast
    foundation models in `openclaw models list`.

  </Accordion>

  <Accordion title="Serviceniveau">
    Sommige Bedrock-modellen ondersteunen een parameter `service_tier` om te optimaliseren voor kosten
    of latency. De volgende niveaus zijn beschikbaar:

    | Niveau | Beschrijving |
    |------|-------------|
    | `default` | Standaard Bedrock-niveau |
    | `flex` | Verwerking met korting voor workloads die langere latency kunnen verdragen |
    | `priority` | Geprioriteerde verwerking voor latencygevoelige workloads |
    | `reserved` | Gereserveerde capaciteit voor steady-state workloads |

    Stel `serviceTier` (of `service_tier`) in via `agents.defaults.params` voor
    Bedrock-modelaanvragen, of per model in
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Geldige waarden zijn `default`, `flex`, `priority` en `reserved`. Niet alle
    modellen ondersteunen alle niveaus — als een niet-ondersteund niveau wordt aangevraagd, retourneert Bedrock
    een validatiefout. Let op: de foutmelding is enigszins misleidend;
    deze kan zeggen "The provided model identifier is invalid" in plaats van aan te geven
    dat het serviceniveau niet wordt ondersteund. Als je deze fout ziet, controleer dan of het model
    het aangevraagde niveau ondersteunt.

  </Accordion>

  <Accordion title="Claude Opus 4.7-temperature">
    Bedrock weigert de parameter `temperature` voor Claude Opus 4.7. OpenClaw
    laat `temperature` automatisch weg voor elke Opus 4.7-Bedrock-ref, inclusief
    foundation model-ID's, benoemde inferentieprofielen, application inference
    profiles waarvan het onderliggende model via
    `bedrock:GetInferenceProfile` naar Opus 4.7 oplost, en gestippelde `opus-4.7`-varianten met
    optionele regioprefixen (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Er is geen config-knop vereist, en de weglating geldt zowel voor
    het object met aanvraagopties als het payloadveld `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Gebruik `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1`, of de
    regionale inference-id's zoals `us.anthropic.claude-fable-5`.
    OpenClaw past Fable's contextvenster van 1M, uitvoerlimiet van 128K, altijd ingeschakeld
    adaptief denken en ondersteunde effort-mapping toe. `/think off` en
    `/think minimal` worden gemapt naar `low`; niet-ondersteunde temperatuur- en geforceerde toolkeuzecontroles
    worden weggelaten. Streaminguitvoer wordt vastgehouden totdat Bedrock
    een terminale status teruggeeft, zodat weigeringen halverwege de stream geen gedeeltelijke tekst blootleggen.
    Fable ondersteunt alleen de standaardservicelaag; OpenClaw negeert geconfigureerde
    `flex`-, `priority`- en `reserved`-lagen voor dit model.

    AWS vereist een expliciete opt-in voor gegevensretentie via `provider_data_share` voordat
    Fable beschikbaar is. Prompts en aanvullingen worden gedeeld met Anthropic en
    maximaal 30 dagen bewaard voor vertrouwen en veiligheid. Controleer en configureer
    [Bedrock-gegevensretentie](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    voordat je het model inschakelt.

  </Accordion>

  <Accordion title="Guardrails">
    Je kunt [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    toepassen op alle Bedrock-modelaanroepen door een `guardrail`-object toe te voegen aan de
    Plugin-configuratie van `amazon-bedrock`. Guardrails laten je inhoudsfiltering,
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
    De IAM-principal die door de Gateway wordt gebruikt, moet naast de standaard invoke-machtigingen ook de machtiging `bedrock:ApplyGuardrail` hebben.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings voor geheugenzoekopdrachten">
    Bedrock kan ook dienen als embeddingprovider voor
    [geheugenzoekopdrachten](/nl/concepts/memory-search). Dit wordt afzonderlijk van de
    inferenceprovider geconfigureerd -- stel `agents.defaults.memorySearch.provider` in op `"bedrock"`:

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

    Bedrock-embeddings gebruiken dezelfde AWS SDK-credentialketen als inference (instance
    roles, SSO, toegangssleutels, gedeelde configuratie en web identity). Er is geen API-sleutel
    nodig. Stel `memorySearch.provider: "bedrock"` expliciet in om Bedrock-
    embeddings te gebruiken.

    Ondersteunde embeddingmodellen omvatten Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) en TwelveLabs Marengo. Zie
    [Referentie voor geheugenconfiguratie -- Bedrock](/nl/reference/memory-config#bedrock-embedding-config)
    voor de volledige modellenlijst en dimensieopties.

  </Accordion>

  <Accordion title="Opmerkingen en kanttekeningen">
    - Bedrock vereist dat **modeltoegang** is ingeschakeld in je AWS-account/regio.
    - Automatische discovery vereist de machtigingen `bedrock:ListFoundationModels` en
      `bedrock:ListInferenceProfiles`.
    - Als je op de automatische modus vertrouwt, stel dan een van de ondersteunde AWS-auth-env-markers in op de
      Gateway-host. Als je IMDS-/shared-config-auth zonder env-markers verkiest, stel dan
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true` in.
    - OpenClaw toont de credentialbron in deze volgorde: `AWS_BEARER_TOKEN_BEDROCK`,
      daarna `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, daarna `AWS_PROFILE`, daarna de
      standaard AWS SDK-keten.
    - Ondersteuning voor redeneren hangt af van het model; controleer de Bedrock-modelkaart voor
      actuele mogelijkheden.
    - Als je een beheerde sleutelstroom verkiest, kun je ook een OpenAI-compatibele
      proxy voor Bedrock plaatsen en die in plaats daarvan configureren als OpenAI-provider.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Geheugenzoekopdrachten" href="/nl/concepts/memory-search" icon="magnifying-glass">
    Bedrock-embeddings voor configuratie van geheugenzoekopdrachten.
  </Card>
  <Card title="Referentie voor geheugenconfiguratie" href="/nl/reference/memory-config#bedrock-embedding-config" icon="database">
    Volledige Bedrock-lijst met embeddingmodellen en dimensieopties.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en FAQ.
  </Card>
</CardGroup>
