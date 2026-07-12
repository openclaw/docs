---
read_when:
    - Je wilt Amazon Bedrock-modellen gebruiken met OpenClaw
    - U moet AWS-aanmeldgegevens en een AWS-regio instellen voor modelaanroepen
summary: Gebruik Amazon Bedrock-modellen (Converse API) met OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T09:17:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kan **Amazon Bedrock**-modellen gebruiken via zijn streamingprovider
**Bedrock Converse**. Bedrock-verificatie gebruikt de **standaardreferentieketen van de AWS SDK**,
niet een API-sleutel.

| Eigenschap | Waarde                                                              |
| ---------- | ------------------------------------------------------------------- |
| Provider   | `amazon-bedrock`                                                    |
| API        | `bedrock-converse-stream`                                           |
| Verificatie | AWS-referenties (omgevingsvariabelen, gedeelde configuratie of instantierol) |
| Regio      | `AWS_REGION` of `AWS_DEFAULT_REGION` (standaard: `us-east-1`)        |

## Aan de slag

Kies de gewenste verificatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="Toegangssleutels / omgevingsvariabelen">
    **Meest geschikt voor:** ontwikkelcomputers, CI of hosts waarop u AWS-referenties rechtstreeks beheert.

    <Steps>
      <Step title="Stel AWS-referenties in op de Gateway-host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optioneel:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optioneel (Bedrock-API-sleutel/bearertoken):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Voeg een Bedrock-provider en -model toe aan uw configuratie">
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
    Met verificatie via omgevingsmarkeringen (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` of `AWS_BEARER_TOKEN_BEDROCK`) schakelt OpenClaw automatisch de impliciete Bedrock-provider in voor modeldetectie, zonder aanvullende configuratie.
    </Tip>

  </Tab>

  <Tab title="EC2-instantierollen (IMDS)">
    **Meest geschikt voor:** EC2-instanties waaraan een IAM-rol is gekoppeld en die de instantiemetadataservice gebruiken voor verificatie.

    <Steps>
      <Step title="Schakel detectie expliciet in">
        Bij gebruik van IMDS kan OpenClaw AWS-verificatie niet alleen aan de hand van omgevingsmarkeringen detecteren. Daarom moet u dit expliciet inschakelen:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Voeg desgewenst een omgevingsmarkering toe voor de automatische modus">
        Als u ook wilt dat automatische detectie via omgevingsmarkeringen werkt (bijvoorbeeld voor `openclaw status`-weergaven):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        U hebt **geen** fictieve API-sleutel nodig.
      </Step>
      <Step title="Controleer of modellen zijn gedetecteerd">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    De IAM-rol die aan uw EC2-instantie is gekoppeld, moet de volgende machtigingen hebben:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (voor automatische detectie)
    - `bedrock:ListInferenceProfiles` (voor detectie van inferentieprofielen)

    U kunt ook het beheerde beleid `AmazonBedrockFullAccess` koppelen.
    </Warning>

    <Note>
    U hebt `AWS_PROFILE=default` alleen nodig als u specifiek een omgevingsmarkering voor de automatische modus of statusweergaven wilt. Het daadwerkelijke Bedrock-runtimeverificatiepad gebruikt de standaardketen van de AWS SDK, zodat verificatie via een IMDS-instantierol ook zonder omgevingsmarkeringen werkt.
    </Note>

  </Tab>
</Tabs>

## Automatische modeldetectie

OpenClaw kan automatisch Bedrock-modellen detecteren die **streaming**
en **tekstuitvoer** ondersteunen. Detectie gebruikt `bedrock:ListFoundationModels` en
`bedrock:ListInferenceProfiles`, en resultaten worden in de cache opgeslagen (standaard: 1 uur).

Zo wordt de impliciete provider ingeschakeld:

- Als `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` is,
  probeert OpenClaw detectie uit te voeren, zelfs wanneer er geen AWS-omgevingsmarkering aanwezig is.
- Als `plugins.entries.amazon-bedrock.config.discovery.enabled` niet is ingesteld,
  voegt OpenClaw de impliciete Bedrock-provider alleen automatisch toe
  wanneer een van deze AWS-verificatiemarkeringen wordt aangetroffen:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` of `AWS_PROFILE`.
- Het daadwerkelijke Bedrock-runtimeverificatiepad gebruikt nog steeds de standaardketen van de AWS SDK,
  zodat gedeelde configuratie, SSO en verificatie via een IMDS-instantierol kunnen werken,
  zelfs wanneer voor detectie `enabled: true` nodig was om dit expliciet in te schakelen.

<Note>
Voor expliciete `models.providers["amazon-bedrock"]`-vermeldingen kan OpenClaw Bedrock-verificatie via omgevingsmarkeringen nog steeds vroegtijdig afleiden uit AWS-omgevingsmarkeringen zoals `AWS_BEARER_TOKEN_BEDROCK`, zonder het laden van de volledige runtimeverificatie af te dwingen. Het daadwerkelijke verificatiepad voor modelaanroepen gebruikt nog steeds de standaardketen van de AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Configuratieopties voor detectie">
    Configuratieopties bevinden zich onder `plugins.entries.amazon-bedrock.config.discovery`:

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
    | ----- | --------- | ------------ |
    | `enabled` | automatisch | In de automatische modus schakelt OpenClaw de impliciete Bedrock-provider alleen in wanneer een ondersteunde AWS-omgevingsmarkering wordt aangetroffen. Stel in op `true` om detectie af te dwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-regio die wordt gebruikt voor API-aanroepen voor detectie. |
    | `providerFilter` | (alle) | Komt overeen met namen van Bedrock-providers (bijvoorbeeld `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cacheduur in seconden. Stel in op `0` om caching uit te schakelen. |
    | `defaultContextWindow` | `32000` | Contextvenster dat wordt gebruikt voor gedetecteerde modellen zonder bekende tokenlimieten (pas dit aan als u de limieten van uw model kent). |
    | `defaultMaxTokens` | `4096` | Maximaal aantal uitvoertokens dat wordt gebruikt voor gedetecteerde modellen zonder bekende tokenlimieten (pas dit aan als u de limieten van uw model kent). |

  </Accordion>

  <Accordion title="Contextvenster en limieten voor het maximale aantal tokens">
    De Bedrock-API's `ListFoundationModels` en `GetFoundationModel` retourneren geen
    metagegevens over tokenlimieten, maar alleen de model-ID, naam, modaliteiten en levenscyclusstatus.
    OpenClaw bevat een opzoektabel met bekende contextvensters en uitvoerlimieten
    voor populaire Bedrock-modellen (Claude, Nova, Llama, Mistral, DeepSeek
    en andere), zodat sessiebeheer, Compaction-drempels en
    detectie van contextoverschrijding correct werken voor deze modellen.

    Gedetecteerde modellen die niet in de tabel staan, vallen terug op `defaultContextWindow`
    en `defaultMaxTokens`. Als voor een model dat u gebruikt nauwkeurige limieten ontbreken,
    overschrijft u deze met een expliciete
    `models.providers["amazon-bedrock"].models`-vermelding.

  </Accordion>
</AccordionGroup>

## Snelle installatie (AWS-traject)

Deze stapsgewijze uitleg maakt een IAM-rol aan, koppelt Bedrock-machtigingen, associeert
het instantieprofiel en schakelt OpenClaw-detectie in op de EC2-host.

```bash
# 1. IAM-rol en instantieprofiel aanmaken
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

# 2. Aan uw EC2-instantie koppelen
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Detectie expliciet inschakelen op de EC2-instantie
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optioneel: een omgevingsmarkering toevoegen als u de automatische modus zonder expliciete inschakeling wilt gebruiken
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Controleren of modellen zijn gedetecteerd
openclaw models list
```

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Inferentieprofielen">
    OpenClaw detecteert **regionale en globale inferentieprofielen** naast
    basismodellen. Wanneer een profiel aan een bekend basismodel is gekoppeld,
    neemt het profiel de mogelijkheden van dat model over (contextvenster, maximaal aantal tokens,
    redeneren, beeldverwerking) en wordt automatisch de juiste Bedrock-aanvraagregio
    ingevoegd. Hierdoor werken Claude-profielen voor meerdere regio's zonder handmatige
    provideroverschrijvingen. Globale profielen voor meerdere regio's (`global.*`) worden
    als eerste weergegeven in `openclaw models list`, omdat ze doorgaans meer capaciteit
    en automatische failover bieden.

    ID's van inferentieprofielen zien eruit als `us.anthropic.claude-opus-4-6-v1:0` (regionaal)
    of `anthropic.claude-opus-4-6-v1:0` (globaal). Als het onderliggende model al
    in de detectieresultaten staat, neemt het profiel de volledige reeks mogelijkheden ervan over;
    anders worden veilige standaardwaarden toegepast.

    Er is geen aanvullende configuratie nodig. Zolang detectie is ingeschakeld en de IAM-
    principal `bedrock:ListInferenceProfiles` heeft, verschijnen profielen naast
    basismodellen in `openclaw models list`.

  </Accordion>

  <Accordion title="Serviceniveau">
    Sommige Bedrock-modellen ondersteunen een parameter `service_tier` om kosten
    of latentie te optimaliseren. De volgende niveaus zijn beschikbaar:

    | Niveau | Beschrijving |
    |--------|--------------|
    | `default` | Standaardniveau van Bedrock |
    | `flex` | Voordeligere verwerking voor werklasten die een hogere latentie kunnen verdragen |
    | `priority` | Verwerking met prioriteit voor latentiegevoelige werklasten |
    | `reserved` | Gereserveerde capaciteit voor werklasten met een constante belasting |

    Stel `serviceTier` (of `service_tier`) via `agents.defaults.params` in voor
    Bedrock-modelaanvragen, of per model in
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // van toepassing op alle modellen
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // overschrijving per model
              },
            },
          },
        },
      },
    }
    ```

    Geldige waarden zijn `default`, `flex`, `priority` en `reserved`. Claude
    Fable 5 en Sonnet 5 ondersteunen alleen het niveau `default`; OpenClaw waarschuwt
    en negeert `flex`, `priority` of `reserved` wanneer die voor deze modellen worden
    aangevraagd. Voor andere modellen geldt dat niet elk model elk niveau ondersteunt:
    een niet-ondersteund niveau retourneert een Bedrock-validatiefout en de foutmelding
    kan misleidend zijn (bijvoorbeeld "The provided model identifier is invalid"
    in plaats van het niveau als probleem te benoemen). Als u deze fout ziet, controleert
    u of het model het aangevraagde niveau ondersteunt.

  </Accordion>

  <Accordion title="Temperatuur van Claude Opus 4.7 en 4.8">
    Bedrock weigert de parameter `temperature` voor Claude Opus 4.7 en Opus
    4.8. OpenClaw laat `temperature` automatisch weg voor elke overeenkomende
    Bedrock-verwijzing, waaronder basismodel-ID's, benoemde inferentieprofielen,
    applicatie-inferentieprofielen waarvan het onderliggende model via
    `bedrock:GetInferenceProfile` wordt herleid tot Opus 4.7/4.8, en varianten
    van `opus-4.7`/`opus-4.8` met punten en optionele regiovoorvoegsels (`us.`,
    `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`). Er is geen configuratieoptie
    vereist en de weglating geldt zowel voor het object met aanvraagopties als
    voor het payloadveld `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Gebruik `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1`, of de
    regionale inferentie-ID's, zoals `us.anthropic.claude-fable-5`.
    OpenClaw past Fables contextvenster van 1M, uitvoerlimiet van 128K,
    altijd ingeschakeld adaptief denken en ondersteunde toewijzing van
    inspanningsniveaus toe. `/think off` en `/think minimal` worden toegewezen
    aan `low`; temperatuur en besturingselementen voor gedwongen toolkeuze
    worden weggelaten, overeenkomstig de route voor Opus 4.7/4.8. Streaminguitvoer
    wordt vastgehouden totdat Bedrock een eindstatus retourneert, zodat weigeringen
    tijdens het streamen geen gedeeltelijke tekst vrijgeven.

    AWS vereist een expliciete opt-in voor gegevensbewaring via
    `provider_data_share` voordat Fable beschikbaar is. Prompts en aanvullingen
    worden gedeeld met Anthropic en maximaal 30 dagen bewaard voor vertrouwen
    en veiligheid. Controleer en configureer
    [Bedrock-gegevensbewaring](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    voordat u het model inschakelt.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 is via Bedrock alleen beschikbaar voor accounts met de
    vereiste goedkeuring voor beperkte toegang. OpenClaw herkent het basismodel
    `anthropic.claude-mythos-5` en regionale of globale inferentieprofielen,
    zoals `us.anthropic.claude-mythos-5`.

    OpenClaw past het contextvenster van 1.000.000 tokens, de uitvoerlimiet van
    128.000 tokens, beeldinvoer, promptcaching, veilig streamen bij weigeringen
    en ingebouwde inspanningsniveaus toe. Adaptief denken is altijd ingeschakeld:
    `/think off` en `/think minimal` worden toegewezen aan `low`, terwijl `xhigh`
    en `max` beschikbaar blijven. Aangepaste steekproefwaarden en waarden voor
    gedwongen toolkeuze worden weggelaten.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS documenteert Sonnet 5 voor zowel de
    [`bedrock-runtime`- als `bedrock-mantle`-eindpunten](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw herkent het Bedrock-basismodel
    `anthropic.claude-sonnet-5` en regionale of globale inferentieprofielen,
    zoals `us.anthropic.claude-sonnet-5`. Het past het contextvenster van
    1.000.000 tokens, de uitvoerlimiet van 128.000 tokens, beeldinvoer,
    ingebouwde inspanningsniveaus, promptcaching en veilig streamen bij
    weigeringen toe.

    Bedrock houdt adaptief denken ingeschakeld voor Sonnet 5. OpenClaw gebruikt
    standaard `high`; `/think off` en `/think minimal` worden toegewezen aan
    `low`, omdat deze route denken niet kan uitschakelen. Aangepaste waarden
    voor temperatuur en gedwongen toolkeuze worden weggelaten zolang adaptief
    denken actief is.

  </Accordion>

  <Accordion title="Beveiligingsregels">
    U kunt [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    toepassen op alle aanroepen van Bedrock-modellen door een `guardrail`-object
    toe te voegen aan de configuratie van de Plugin `amazon-bedrock`.
    Beveiligingsregels stellen u in staat inhoudsfiltering, weigering van
    onderwerpen, woordfilters, filters voor gevoelige informatie en controles
    op contextuele onderbouwing af te dwingen.

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

    `guardrailIdentifier` en `guardrailVersion` zijn vereist.

    | Optie | Beschrijving |
    | ------ | ----------- |
    | `guardrailIdentifier` | ID van de beveiligingsregel (bijvoorbeeld `abc123`) of volledige ARN (bijvoorbeeld `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Nummer van de gepubliceerde versie, of `"DRAFT"` voor het werkconcept. |
    | `streamProcessingMode` | `"sync"` of `"async"` voor evaluatie van beveiligingsregels tijdens het streamen. Als dit wordt weggelaten, gebruikt Bedrock de standaardwaarde. |
    | `trace` | `"enabled"` of `"enabled_full"` voor foutopsporing; laat dit weg of stel het in op `"disabled"` voor productie. |

    <Warning>
    De IAM-principal die door de Gateway wordt gebruikt, moet naast de standaardmachtigingen voor aanroepen ook de machtiging `bedrock:ApplyGuardrail` hebben.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings voor geheugendoorzoeking">
    Bedrock kan ook dienen als embeddingprovider voor
    [geheugendoorzoeking](/nl/concepts/memory-search). Dit wordt afzonderlijk van de
    inferentieprovider geconfigureerd: stel `agents.defaults.memorySearch.provider`
    in op `"bedrock"`:

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

    Bedrock-embeddings gebruiken dezelfde AWS SDK-referentieketen als inferentie
    (instantie-rollen, SSO, toegangssleutels, gedeelde configuratie en webidentiteit).
    Er is geen API-sleutel nodig.

    Ondersteunde embeddingmodellen zijn onder andere Amazon Titan Embed (v1, v2),
    Amazon Nova Embed, Cohere Embed (v3, v4) en TwelveLabs Marengo. Zie
    [Configuratiereferentie voor geheugen -- Bedrock](/nl/reference/memory-config#bedrock-embedding-config)
    voor de volledige modellenlijst en dimensieopties.

  </Accordion>

  <Accordion title="Opmerkingen en aandachtspunten">
    - Voor Bedrock moet **modeltoegang** zijn ingeschakeld in uw AWS-account/regio.
    - Automatische detectie vereist de machtigingen `bedrock:ListFoundationModels`
      en `bedrock:ListInferenceProfiles`.
    - Als u de automatische modus gebruikt, stelt u op de Gateway-host een van de
      ondersteunde AWS-omgevingsmarkeringen voor authenticatie in. Als u de voorkeur
      geeft aan IMDS-/gedeelde-configuratie-authenticatie zonder omgevingsmarkeringen,
      stelt u `plugins.entries.amazon-bedrock.config.discovery.enabled: true` in.
    - OpenClaw toont de bron van de referenties in deze volgorde:
      `AWS_BEARER_TOKEN_BEDROCK`, vervolgens `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, daarna `AWS_PROFILE` en ten slotte de standaard
      AWS SDK-keten.
    - Ondersteuning voor redeneren hangt af van het model; raadpleeg de
      Bedrock-modelkaart voor de huidige mogelijkheden.
    - Als u de voorkeur geeft aan een beheerde sleutelprocedure, kunt u ook een
      OpenAI-compatibele proxy vóór Bedrock plaatsen en deze in plaats daarvan
      configureren als OpenAI-provider.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Geheugendoorzoeking" href="/nl/concepts/memory-search" icon="magnifying-glass">
    Bedrock-embeddings configureren voor geheugendoorzoeking.
  </Card>
  <Card title="Referentie voor geheugenconfiguratie" href="/nl/reference/memory-config#bedrock-embedding-config" icon="database">
    Volledige lijst met Bedrock-embeddingmodellen en dimensieopties.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
