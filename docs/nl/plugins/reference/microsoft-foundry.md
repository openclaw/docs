---
read_when:
    - Je installeert, configureert of controleert de microsoft-foundry-plugin
summary: Voegt ondersteuning voor de Microsoft Foundry-modelprovider toe aan OpenClaw.
title: Microsoft Foundry-Plugin
x-i18n:
    generated_at: "2026-07-16T16:15:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry-Plugin

Voegt ondersteuning voor de Microsoft Foundry-modelprovider toe aan OpenClaw.

## Distributie

- Pakket: `@openclaw/microsoft-foundry`
- Installatieroute: opgenomen in OpenClaw

## Oppervlak

providers: `microsoft-foundry`; contracten: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- Provider voor het genereren van afbeeldingen: `microsoft-foundry`

## Vereisten

- Een Microsoft Foundry- of Azure AI Foundry-resource met implementaties.
- API-sleutelauthenticatie via `AZURE_OPENAI_API_KEY` of een geconfigureerde API-sleutel voor de provider.
- Installeer voor Entra ID-authenticatie de Azure CLI en voer vóór
  de onboarding `az login` uit. OpenClaw vernieuwt Microsoft Foundry-runtime-tokens via
  `az account get-access-token`.

## Chatmodellen

Microsoft Foundry-chatimplementaties gebruiken de modelreferentie van de provider
`microsoft-foundry/<deployment-name>`. Tijdens de onboarding worden Foundry-resources
en -implementaties met de Azure CLI gedetecteerd, waarna de naam van de geselecteerde implementatie
naar de modelconfiguratie wordt geschreven.

OpenClaw gebruikt het Foundry-`/openai/v1`-eindpunt voor ondersteunde OpenAI-compatibele
chat-API's:

- De modelfamilies GPT, `o*`, `computer-use-preview` en DeepSeek-V4 gebruiken standaard
  `openai-responses`.
- MAI-DS-R1 en andere chatvoltooiingsimplementaties gebruiken `openai-completions`,
  tenzij expliciet een ondersteunde API is geconfigureerd.
- MAI-DS-R1 wordt op basis van redeneringsinhoud geregistreerd als geschikt voor redeneren, niet
  via `reasoning_effort`. De metadata voor context- en uitvoertokens bedraagt
  163,840 tokens.

Anthropic Claude-implementaties in Microsoft Foundry gebruiken de vorm van de Anthropic Messages-
API, niet de OpenAI-compatibele `/openai/v1`-vorm. Configureer deze als een
aangepaste `anthropic-messages`-provider totdat de Microsoft Foundry-Plugin een
eigen Anthropic-runtime krijgt. Wanneer de naam van de Foundry-implementatie afwijkt van de
Claude-model-ID, stel je `params.canonicalModelId` in voor de modelvermelding, zodat OpenClaw
modelspecifieke wire-contracten kan toepassen, `/think off` correct kan toewijzen en
ondertekende denkgegevens veilig kan behouden.

## MAI-afbeeldingen genereren

De Plugin registreert `microsoft-foundry` voor `image_generate` met de huidige
Microsoft AI-afbeeldingsmodellen:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Gebruik de naam van een geïmplementeerde MAI-afbeeldingsimplementatie als modelreferentie. De provider
declareert geen standaard afbeeldingsmodel, omdat de MAI-API de naam van jouw implementatie
vereist in het `model`-veld van het verzoek:

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

Genereren met alleen een prompt roept het MAI-generatie-eindpunt van Microsoft Foundry aan:
`/mai/v1/images/generations`. Bewerkingen met referentieafbeeldingen roepen
`/mai/v1/images/edits` aan en zijn beperkt tot implementaties van `MAI-Image-2.5-Flash` en
`MAI-Image-2.5`.

Genereren met alleen een prompt kan een aangepaste implementatienaam gebruiken wanneer alleen het Foundry-
eindpunt is geconfigureerd. Selecteer voor afbeeldingsbewerkingen met een aangepaste implementatienaam de
implementatie via de onboarding of voeg modelmetadata toe, zodat OpenClaw kan verifiëren
dat de implementatie wordt ondersteund door `MAI-Image-2.5-Flash` of `MAI-Image-2.5`.

Beperkingen voor MAI-afbeeldingen:

- Uitvoer: één PNG-afbeelding per verzoek.
- Grootte: standaard `1024x1024`; zowel de breedte als de hoogte moet ten minste 768 px zijn.
- Totaal aantal pixels: breedte × hoogte mag maximaal 1,048,576 zijn.
- Bewerkingen: één PNG- of JPEG-invoerafbeelding.
- Niet-ondersteunde gedeelde aanwijzingen zoals `aspectRatio`, `resolution`, `quality`,
  `background` en niet-PNG-`outputFormat` worden niet naar Microsoft Foundry verzonden.

## Probleemoplossing

- `az: command not found`: installeer de Azure CLI of gebruik API-sleutelauthenticatie.
- `Microsoft Foundry endpoint missing for MAI image generation`: selecteer via de onboarding een
  Foundry-implementatie of voeg `models.providers.microsoft-foundry.baseUrl` toe.
- `supports MAI image deployments only`: het geselecteerde afbeeldingsmodel verwijst naar een
  niet-MAI-implementatie. Gebruik voor `image_generate` een geïmplementeerd MAI-afbeeldingsmodel.

<!-- openclaw-plugin-reference:manual-end -->
