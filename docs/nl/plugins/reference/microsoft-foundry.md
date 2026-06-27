---
read_when:
    - Je installeert, configureert of controleert de microsoft-foundry-plugin
summary: Voegt ondersteuning voor de Microsoft Foundry-modelprovider toe aan OpenClaw.
title: Microsoft Foundry-plugin
x-i18n:
    generated_at: "2026-06-27T18:02:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry-Plugin

Voegt ondersteuning voor Microsoft Foundry-modelproviders toe aan OpenClaw.

## Distributie

- Pakket: `@openclaw/microsoft-foundry`
- Installatieroute: inbegrepen in OpenClaw

## Oppervlak

providers: microsoft-foundry; contracten: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Afbeeldingsgeneratieprovider: `microsoft-foundry`

## Vereisten

- Een Microsoft Foundry- of Azure AI Foundry-resource met implementaties.
- API-sleutelauthenticatie via `AZURE_OPENAI_API_KEY` of een geconfigureerde provider-API-sleutel.
- Installeer voor Entra ID-authenticatie de Azure CLI en voer `az login` uit vóór
  onboarding. OpenClaw vernieuwt Microsoft Foundry-runtime-tokens via
  `az account get-access-token`.

## Chatmodellen

Microsoft Foundry-chatimplementaties gebruiken de providermodelreferentie
`microsoft-foundry/<deployment-name>`. Onboarding ontdekt Foundry-resources
en implementaties met de Azure CLI en schrijft vervolgens de geselecteerde implementatienaam naar
de modelconfiguratie.

OpenClaw gebruikt het Foundry-`/openai/v1`-eindpunt voor ondersteunde OpenAI-compatibele
chat-API's:

- GPT-, `o*`-, `computer-use-preview`- en DeepSeek-V4-modelfamilies gebruiken standaard
  `openai-responses`.
- MAI-DS-R1- en andere chatcompletion-implementaties gebruiken `openai-completions`,
  tenzij een expliciet ondersteunde API is geconfigureerd.
- MAI-DS-R1 wordt geregistreerd als geschikt voor redeneren via reasoning-inhoud, niet
  via `reasoning_effort`. De metadata voor context- en uitvoertokens zijn
  163.840 tokens.

Anthropic Claude-implementaties in Microsoft Foundry gebruiken de Anthropic Messages
API-vorm, niet de OpenAI-compatibele `/openai/v1`-vorm. Configureer deze als een
aangepaste `anthropic-messages`-provider totdat de Microsoft Foundry-Plugin een
native Anthropic-runtime krijgt. Wanneer de Foundry-implementatienaam afwijkt van de
Claude-model-ID, stel dan `params.canonicalModelId` in op de modelvermelding zodat OpenClaw
modelspecifieke wire-contracten kan toepassen, `/think off` correct kan mappen en
signed thinking veilig kan behouden.

## MAI-afbeeldingsgeneratie

De Plugin registreert `microsoft-foundry` voor `image_generate` met de huidige
Microsoft AI-afbeeldingsmodellen:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Gebruik een geïmplementeerde MAI-afbeeldingsimplementatienaam als modelreferentie. De provider declareert
geen standaardafbeeldingsmodel omdat de MAI-API je implementatienaam vereist
in het aanvraagveld `model`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Aanroepen voor generatie met alleen een prompt gebruiken het MAI-generatie-eindpunt van Microsoft Foundry:
`/mai/v1/images/generations`. Bewerkingen met referentieafbeeldingen gebruiken
`/mai/v1/images/edits` en zijn beperkt tot `MAI-Image-2.5-Flash`- en
`MAI-Image-2.5`-implementaties.

Generatie met alleen een prompt kan een aangepaste implementatienaam gebruiken als alleen het Foundry-
eindpunt is geconfigureerd. Selecteer voor afbeeldingsbewerkingen met een aangepaste implementatienaam de
implementatie via onboarding of neem modelmetadata op zodat OpenClaw kan verifiëren
dat de implementatie wordt ondersteund door `MAI-Image-2.5-Flash` of `MAI-Image-2.5`.

MAI-afbeeldingsbeperkingen:

- Uitvoer: één PNG-afbeelding per aanvraag.
- Grootte: standaard `1024x1024`; zowel breedte als hoogte moeten ten minste 768 px zijn.
- Totaal aantal pixels: breedte × hoogte mag maximaal 1.048.576 zijn.
- Bewerkingen: één PNG- of JPEG-invoerafbeelding.
- Niet-ondersteunde gedeelde hints zoals `aspectRatio`, `resolution`, `quality`,
  `background` en niet-PNG `outputFormat` worden niet naar Microsoft Foundry verzonden.

## Probleemoplossing

- `az: command not found`: installeer de Azure CLI of gebruik API-sleutelauthenticatie.
- `Microsoft Foundry endpoint missing for MAI image generation`: selecteer een
  Foundry-implementatie via onboarding of voeg `models.providers.microsoft-foundry.baseUrl` toe.
- `supports MAI image deployments only`: het geselecteerde afbeeldingsmodel wijst naar een
  niet-MAI-implementatie. Gebruik een geïmplementeerd MAI-afbeeldingsmodel voor `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
