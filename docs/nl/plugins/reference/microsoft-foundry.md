---
read_when:
    - U installeert, configureert of controleert de microsoft-foundry-plugin
summary: Voegt ondersteuning voor de Microsoft Foundry-modelprovider toe aan OpenClaw.
title: Microsoft Foundry-Plugin
x-i18n:
    generated_at: "2026-07-12T09:13:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry-Plugin

Voegt ondersteuning voor de Microsoft Foundry-modelprovider toe aan OpenClaw.

## Distributie

- Pakket: `@openclaw/microsoft-foundry`
- Installatieroute: opgenomen in OpenClaw

## Oppervlak

providers: microsoft-foundry; contracten: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provider voor het genereren van afbeeldingen: `microsoft-foundry`

## Vereisten

- Een Microsoft Foundry- of Azure AI Foundry-resource met implementaties.
- Authenticatie met een API-sleutel via `AZURE_OPENAI_API_KEY` of een geconfigureerde API-sleutel voor de provider.
- Installeer voor authenticatie met Entra ID de Azure CLI en voer vóór
  de onboarding `az login` uit. OpenClaw vernieuwt runtimetokens voor Microsoft Foundry via
  `az account get-access-token`.

## Chatmodellen

Chatimplementaties van Microsoft Foundry gebruiken de modelreferentie van de provider
`microsoft-foundry/<deployment-name>`. De onboarding detecteert Foundry-resources
en -implementaties met de Azure CLI en schrijft vervolgens de naam van de geselecteerde implementatie naar
de modelconfiguratie.

OpenClaw gebruikt het Foundry-eindpunt `/openai/v1` voor ondersteunde, met OpenAI compatibele
chat-API's:

- De modelfamilies GPT, `o*`, `computer-use-preview` en DeepSeek-V4 gebruiken standaard
  `openai-responses`.
- MAI-DS-R1 en andere implementaties voor chatvoltooiing gebruiken `openai-completions`,
  tenzij expliciet een ondersteunde API is geconfigureerd.
- MAI-DS-R1 wordt geregistreerd als geschikt voor redeneren via redeneerinhoud, niet
  via `reasoning_effort`. De metagegevens voor context- en uitvoertokens bedragen
  163.840 tokens.

Implementaties van Anthropic Claude in Microsoft Foundry gebruiken de vorm van de Anthropic Messages-
API, niet de met OpenAI compatibele vorm `/openai/v1`. Configureer deze als een
aangepaste `anthropic-messages`-provider totdat de Microsoft Foundry-Plugin een
eigen Anthropic-runtime krijgt. Wanneer de naam van de Foundry-implementatie afwijkt van de
Claude-model-ID, stelt u `params.canonicalModelId` in bij de modelvermelding, zodat OpenClaw
modelspecifieke communicatiecontracten kan toepassen, `/think off` correct kan toewijzen en
ondertekende redeneerinhoud veilig kan behouden.

## MAI-afbeeldingen genereren

De Plugin registreert `microsoft-foundry` voor `image_generate` met de huidige
Microsoft AI-afbeeldingsmodellen:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Gebruik de naam van een geïmplementeerde MAI-afbeeldingsimplementatie als modelreferentie. De provider
declareert geen standaardafbeeldingsmodel, omdat de MAI-API de naam van uw implementatie
vereist in het aanvraagveld `model`:

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
`/mai/v1/images/generations`. Bewerkingen met een referentieafbeelding roepen
`/mai/v1/images/edits` aan en zijn beperkt tot implementaties van `MAI-Image-2.5-Flash` en
`MAI-Image-2.5`.

Voor genereren met alleen een prompt kan een aangepaste implementatienaam worden gebruikt wanneer alleen het Foundry-
eindpunt is geconfigureerd. Selecteer voor afbeeldingsbewerkingen met een aangepaste implementatienaam de
implementatie via de onboarding of voeg modelmetagegevens toe, zodat OpenClaw kan verifiëren
dat de implementatie is gebaseerd op `MAI-Image-2.5-Flash` of `MAI-Image-2.5`.

Beperkingen voor MAI-afbeeldingen:

- Uitvoer: één PNG-afbeelding per aanvraag.
- Grootte: standaard `1024x1024`; zowel de breedte als de hoogte moet ten minste 768 px zijn.
- Totaal aantal pixels: breedte × hoogte mag maximaal 1.048.576 zijn.
- Bewerkingen: één PNG- of JPEG-invoerafbeelding.
- Niet-ondersteunde gedeelde aanwijzingen zoals `aspectRatio`, `resolution`, `quality`,
  `background` en andere `outputFormat`-waarden dan PNG worden niet naar Microsoft Foundry verzonden.

## Probleemoplossing

- `az: command not found`: installeer de Azure CLI of gebruik authenticatie met een API-sleutel.
- `Microsoft Foundry endpoint missing for MAI image generation`: selecteer een
  Foundry-implementatie via de onboarding of voeg `models.providers.microsoft-foundry.baseUrl` toe.
- `supports MAI image deployments only`: het geselecteerde afbeeldingsmodel verwijst naar een
  niet-MAI-implementatie. Gebruik een geïmplementeerd MAI-afbeeldingsmodel voor `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
