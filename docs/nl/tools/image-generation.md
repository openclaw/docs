---
read_when:
    - Afbeeldingen genereren of bewerken via de agent
    - Providers en modellen voor het genereren van afbeeldingen configureren
    - Inzicht in de parameters van het hulpmiddel image_generate
sidebarTitle: Image generation
summary: Genereer en bewerk afbeeldingen via image_generate in OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI en Vydra
title: Afbeeldingen genereren
x-i18n:
    generated_at: "2026-07-12T09:23:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

De tool `image_generate` maakt en bewerkt afbeeldingen via je geconfigureerde
providers. In chatsessies wordt deze asynchroon uitgevoerd: OpenClaw registreert een
achtergrondtaak, retourneert onmiddellijk de taak-id en activeert de agent wanneer
de provider klaar is. De voltooiingsagent volgt de normale modus voor
zichtbare antwoorden van de sessie: automatische aflevering van het definitieve antwoord
wanneer dit is geconfigureerd, of `message(action="send")` wanneer de sessie de
berichtentool vereist. Als de aanvragende sessie inactief is of de actieve activering
mislukt, verzendt OpenClaw een idempotente directe terugval met de gegenereerde
afbeeldingen, zodat het resultaat niet verloren gaat.

<Note>
De tool verschijnt alleen wanneer ten minste één provider voor het genereren van
afbeeldingen beschikbaar is. Als je `image_generate` niet tussen de tools van je agent ziet,
configureer dan `agents.defaults.imageGenerationModel`, stel een API-sleutel van een provider in
of meld je aan met OpenAI ChatGPT/Codex OAuth.
</Note>

## Snel aan de slag

<Steps>
  <Step title="Authenticatie configureren">
    Stel een API-sleutel in voor ten minste één provider (bijvoorbeeld `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) of meld je aan met OpenAI Codex OAuth.
  </Step>
  <Step title="Een standaardmodel kiezen (optioneel)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth gebruikt dezelfde modelreferentie `openai/gpt-image-2`. Wanneer een
    OAuth-profiel voor `openai` is geconfigureerd, leidt OpenClaw afbeeldingsaanvragen
    via dat OAuth-profiel in plaats van eerst `OPENAI_API_KEY` te proberen.
    Expliciete configuratie van `models.providers.openai` (API-sleutel, aangepaste/Azure-basis-URL)
    schakelt weer over op de directe route van de OpenAI Images API.

  </Step>
  <Step title="De agent een opdracht geven">
    _"Genereer een afbeelding van een vriendelijke robotmascotte."_

    De agent roept `image_generate` automatisch aan. De tool hoeft niet op een toelatingslijst
    te worden gezet: deze is standaard ingeschakeld wanneer een provider beschikbaar is. De tool
    retourneert een achtergrondtaak-id, waarna de voltooiingsagent de
    gegenereerde bijlage via de tool `message` verzendt zodra deze gereed is.

  </Step>
</Steps>

<Warning>
Voor OpenAI-compatibele LAN-eindpunten zoals LocalAI behoud je de aangepaste
`models.providers.openai.baseUrl` en schakel je deze expliciet in met
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Privé- en
interne afbeeldingseindpunten blijven standaard geblokkeerd.
</Warning>

## Veelgebruikte routes

| Doel                                                   | Modelreferentie                                    | Authenticatie                          |
| ------------------------------------------------------ | -------------------------------------------------- | -------------------------------------- |
| OpenAI-afbeeldingen genereren met API-facturering      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-afbeeldingen genereren met Codex-abonnementsauthenticatie | `openai/gpt-image-2`                        | OpenAI ChatGPT/Codex OAuth             |
| OpenAI PNG/WebP met transparante achtergrond           | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` of OpenAI Codex OAuth |
| Afbeeldingen genereren met DeepInfra                   | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Expressieve/stijlgestuurde generatie met fal Krea 2    | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| Afbeeldingen genereren met OpenRouter                  | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Afbeeldingen genereren met LiteLLM                     | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Afbeeldingen genereren met Microsoft Foundry MAI       | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` of Entra ID     |
| Afbeeldingen genereren met Google Gemini               | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` of `GOOGLE_API_KEY`   |

Dezelfde tool verwerkt zowel tekst-naar-afbeelding als bewerking met referentieafbeeldingen. Gebruik `image`
voor één referentie of `images` voor meerdere. Voor Krea 2-modellen op fal worden die
referenties verzonden als stijlreferenties in plaats van als invoer voor bewerking.
Door de provider ondersteunde uitvoerhints zoals `quality`, `outputFormat` en
`background` worden doorgestuurd wanneer ze beschikbaar zijn en als genegeerd gemeld wanneer een
provider geen ondersteuning aangeeft. De ingebouwde ondersteuning voor transparante achtergronden is
specifiek voor OpenAI; andere providers kunnen PNG-alfa nog steeds behouden als hun
backend deze uitvoert.

## Ondersteunde providers

| Provider          | Standaardmodel                          | Ondersteuning voor bewerking             | Authenticatie                                          |
| ----------------- | --------------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| ComfyUI           | `workflow`                              | Ja (1 afbeelding, geconfigureerd in workflow) | `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` voor de cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Ja (1 afbeelding)                        | `DEEPINFRA_API_KEY`                                    |
| fal               | `fal-ai/flux/dev`                       | Ja (modelspecifieke limieten)            | `FAL_KEY`                                              |
| Google            | `gemini-3.1-flash-image-preview`        | Ja (maximaal 5 afbeeldingen)             | `GEMINI_API_KEY` of `GOOGLE_API_KEY`                   |
| LiteLLM           | `gpt-image-2`                           | Ja (maximaal 5 invoerafbeeldingen)       | `LITELLM_API_KEY`                                      |
| Microsoft Foundry | `<deployment-name>`                     | Ja (alleen MAI-Image-2.5-modellen)       | `AZURE_OPENAI_API_KEY` of Entra ID (`az login`)        |
| MiniMax           | `image-01`                              | Ja (onderwerpreferentie)                 | `MINIMAX_API_KEY` of MiniMax OAuth (`minimax-portal`)  |
| OpenAI            | `gpt-image-2`                           | Ja (maximaal 5 afbeeldingen)             | `OPENAI_API_KEY` of OpenAI ChatGPT/Codex OAuth         |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Ja (maximaal 5 invoerafbeeldingen)       | `OPENROUTER_API_KEY`                                   |
| Vydra             | `grok-imagine`                          | Nee                                      | `VYDRA_API_KEY`                                        |
| xAI               | `grok-imagine-image`                    | Ja (maximaal 3 afbeeldingen)             | `XAI_API_KEY`                                          |

Gebruik `action: "list"` om tijdens runtime beschikbare providers en modellen te bekijken:

```text
/tool image_generate action=list
```

Gebruik `action: "status"` om de actieve taak voor het genereren van afbeeldingen van de
huidige sessie te bekijken:

```text
/tool image_generate action=status
```

## Mogelijkheden van providers

| Mogelijkheid              | ComfyUI                    | DeepInfra    | fal                                                | Google                  | Microsoft Foundry | MiniMax                       | OpenAI                  | Vydra | xAI                     |
| ------------------------- | -------------------------- | ------------ | -------------------------------------------------- | ----------------------- | ----------------- | ----------------------------- | ----------------------- | ----- | ----------------------- |
| Genereren (maximumaantal) | 1                          | 4            | 4                                                  | 4                       | 1                 | 9                             | 4                       | 1     | 4                       |
| Bewerken/referentie       | 1 afbeelding (workflow)    | 1 afbeelding | Flux: 1; GPT: 10; Krea-stijlreferenties: 10; NB2: 14 | Maximaal 5 afbeeldingen | 1 afbeelding      | 1 afbeelding (onderwerpreferentie) | Maximaal 5 afbeeldingen | -     | Maximaal 3 afbeeldingen |
| Grootte instellen         | -                          | ✓            | ✓                                                  | ✓                       | ✓                 | -                             | Maximaal 4K             | -     | -                       |
| Beeldverhouding           | -                          | -            | ✓                                                  | ✓                       | -                 | ✓                             | -                       | -     | ✓                       |
| Resolutie (1K/2K/4K)      | -                          | -            | ✓                                                  | ✓                       | -                 | -                             | -                       | -     | 1K, 2K                  |

## Toolparameters

<ParamField path="prompt" type="string" required>
  Prompt voor het genereren van afbeeldingen. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Gebruik `"status"` om de actieve sessietaak te bekijken of `"list"` om tijdens
  runtime beschikbare providers en modellen te bekijken.
</ParamField>
<ParamField path="model" type="string">
  Overschrijving van provider/model (bijvoorbeeld `openai/gpt-image-2`). Gebruik
  `openai/gpt-image-1.5` voor transparante OpenAI-achtergronden.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL van één referentieafbeelding voor de bewerkingsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentieafbeeldingen voor de bewerkingsmodus of modellen met stijlreferenties (maximaal 14
  via de gedeelde tool; providerspecifieke limieten blijven van toepassing).
</ParamField>
<ParamField path="size" type="string">
  Groottehint: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Beeldverhouding: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Providers valideren hun modelspecifieke subset.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Resolutiehint.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Kwaliteitshint wanneer de provider deze ondersteunt.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Hint voor de uitvoerindeling wanneer de provider deze ondersteunt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Achtergrondhint wanneer de provider deze ondersteunt. Gebruik `transparent` met
  `outputFormat: "png"` of `"webp"` voor providers die transparantie ondersteunen.
</ParamField>
<ParamField path="count" type="number">Aantal te genereren afbeeldingen (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Optionele time-out voor providerverzoeken in milliseconden. Wanneer Codex
  `image_generate` via dynamische tools aanroept, overschrijft deze waarde per aanroep nog steeds
  de geconfigureerde standaardwaarde en is deze begrensd op 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Hint voor de uitvoerbestandsnaam.</ParamField>
<ParamField path="openai" type="object">
  Alleen voor OpenAI bestemde hints: `background`, `moderation`, `outputCompression` en `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Creativiteitsinstelling voor fal Krea 2. De standaardwaarde is `medium`.
</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. Wanneer een terugvalprovider een
vergelijkbare geometrieoptie ondersteunt in plaats van de exact aangevraagde, wijst OpenClaw deze vóór
verzending opnieuw toe aan de dichtstbijzijnde ondersteunde grootte, beeldverhouding of resolutie.
Niet-ondersteunde uitvoerhints worden weggelaten voor providers die geen
ondersteuning aangeven en worden in het toolresultaat gemeld. Toolresultaten vermelden de toegepaste
instellingen; `details.normalization` legt elke omzetting van aangevraagde naar toegepaste
waarden vast.
</Note>

## Configuratie

### Modelselectie

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Selectievolgorde van providers

OpenClaw probeert providers in deze volgorde:

1. **Parameter `model`** uit de toolaanroep (als de agent er een opgeeft).
2. **`imageGenerationModel.primary`** uit de configuratie.
3. **`imageGenerationModel.fallbacks`** in volgorde.
4. **Automatische detectie** - alleen standaardproviders met beschikbare authenticatie:
   - eerst de huidige standaardprovider;
   - daarna de overige geregistreerde providers voor afbeeldingsgeneratie, gesorteerd op provider-id.

Als een provider mislukt (authenticatiefout, snelheidslimiet enzovoort), wordt
automatisch de volgende geconfigureerde kandidaat geprobeerd. Als alle pogingen
mislukken, bevat de fout details van elke poging.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Een `model`-overschrijving per aanroep probeert uitsluitend die provider en
    dat model en gaat niet verder met de geconfigureerde primaire provider,
    fallbackproviders of automatisch gedetecteerde providers.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Een standaardprovider wordt alleen aan de kandidatenlijst toegevoegd als
    OpenClaw zich daadwerkelijk bij die provider kan authenticeren. Stel
    `agents.defaults.mediaGenerationAutoProviderFallback: false` in om uitsluitend
    expliciete vermeldingen voor `model`, `primary` en `fallbacks` te gebruiken.
  </Accordion>
  <Accordion title="Timeouts">
    Stel `agents.defaults.imageGenerationModel.timeoutMs` in voor trage backends
    voor afbeeldingsgeneratie. Een toolparameter `timeoutMs` per aanroep overschrijft
    de geconfigureerde standaardwaarde, en geconfigureerde standaardwaarden
    overschrijven door plugins ingestelde standaardwaarden van providers. Gehoste
    afbeeldingsproviders van Google en OpenRouter gebruiken standaard 180 seconden;
    afbeeldingsgeneratie van Microsoft Foundry MAI, xAI en Azure OpenAI gebruikt
    600 seconden. Dynamische toolaanroepen van Codex gebruiken voor `image_generate`
    standaard een bridge-time-out van 120 seconden en respecteren hetzelfde
    geconfigureerde time-outbudget, begrensd door het maximum van 600000 ms voor
    de dynamische-toolbridge van OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Gebruik `action: "list"` om de momenteel geregistreerde providers,
    hun standaardmodellen en aanwijzingen voor authenticatie-omgevingsvariabelen
    te bekijken.
  </Accordion>
</AccordionGroup>

### Afbeeldingen bewerken

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI en xAI ondersteunen het bewerken van referentieafbeeldingen. Krea 2-modellen
op fal gebruiken dezelfde velden `image` / `images` als stijlreferenties in plaats
van invoer voor bewerkingen. Geef een pad of URL naar een referentieafbeelding door:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter en Google ondersteunen maximaal 5 referentieafbeeldingen via
de parameter `images`; xAI ondersteunt er maximaal 3. fal ondersteunt 1
referentieafbeelding voor Flux-beeld-naar-beeld, maximaal 10 voor GPT Image 2-bewerkingen,
maximaal 10 stijlreferenties voor Krea 2 en maximaal 14 voor Nano Banana 2-bewerkingen.
Microsoft Foundry, MiniMax en ComfyUI ondersteunen er 1.

## Uitgebreide informatie per provider

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    OpenAI-afbeeldingsgeneratie gebruikt standaard `openai/gpt-image-2`. Als een
    OAuth-profiel voor `openai` is geconfigureerd, hergebruikt OpenClaw hetzelfde
    OAuth-profiel dat wordt gebruikt door Codex-chatmodellen met abonnement en
    verzendt het afbeeldingsverzoek via de Codex Responses-backend. Verouderde
    Codex-basis-URL's zoals `https://chatgpt.com/backend-api` worden voor
    afbeeldingsverzoeken omgezet naar de canonieke URL
    `https://chatgpt.com/backend-api/codex`. OpenClaw valt voor dat verzoek
    **niet** stilzwijgend terug op `OPENAI_API_KEY` - om routering rechtstreeks
    via de OpenAI Images API af te dwingen, configureert u
    `models.providers.openai` expliciet met een API-sleutel, aangepaste basis-URL
    of Azure-eindpunt.

    De modellen `openai/gpt-image-1.5`, `openai/gpt-image-1` en
    `openai/gpt-image-1-mini` kunnen nog steeds expliciet worden geselecteerd.
    Gebruik `gpt-image-1.5` voor PNG/WebP-uitvoer met transparante achtergrond;
    de huidige API van `gpt-image-2` weigert `background: "transparent"`.

    `gpt-image-2` ondersteunt zowel tekst-naar-beeldgeneratie als het bewerken
    van referentieafbeeldingen via dezelfde tool `image_generate`.
    OpenClaw stuurt `prompt`, `count`, `size`, `quality`, `outputFormat`
    en referentieafbeeldingen door naar OpenAI. OpenAI ontvangt `aspectRatio`
    en `resolution` **niet** rechtstreeks; waar mogelijk zet OpenClaw deze om
    naar een ondersteunde `size`, anders meldt de tool ze als genegeerde
    overschrijvingen.

    OpenAI-specifieke opties staan onder het object `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` accepteert `transparent`, `opaque` of `auto`;
    transparante uitvoer vereist voor `outputFormat` de waarde `png` of `webp`
    en een OpenAI-afbeeldingsmodel dat transparantie ondersteunt. OpenClaw
    routeert verzoeken met de standaardwaarde `gpt-image-2` en een transparante
    achtergrond naar `gpt-image-1.5`. `openai.outputCompression` is van toepassing
    op JPEG/WebP-uitvoer en wordt genegeerd voor PNG-uitvoer.

    De hint `background` op het hoogste niveau is providerneutraal en wordt
    momenteel gekoppeld aan hetzelfde OpenAI-verzoekveld `background` wanneer
    de OpenAI-provider is geselecteerd. Providers die geen ondersteuning voor
    achtergronden declareren, retourneren deze in `ignoredOverrides` in plaats
    van de niet-ondersteunde parameter te ontvangen.

    Zie [Azure OpenAI-eindpunten](/nl/providers/openai#azure-openai-endpoints)
    om OpenAI-afbeeldingsgeneratie via een Azure OpenAI-implementatie te routeren
    in plaats van via `api.openai.com`.

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Microsoft Foundry-afbeeldingsgeneratie gebruikt namen van geïmplementeerde
    MAI-afbeeldingsimplementaties onder het providerprefix `microsoft-foundry/`.
    Er is geen standaardmodel op providerniveau, omdat de MAI-API de naam van
    uw implementatie in het veld `model` verwacht:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    De provider gebruikt de MAI-API van Microsoft Foundry, niet de OpenAI Images API:

    - Eindpunt voor genereren: `/mai/v1/images/generations`
    - Eindpunt voor bewerken: `/mai/v1/images/edits`
    - Authenticatie: `AZURE_OPENAI_API_KEY` / API-sleutel van de provider, of Entra ID via `az login`
    - Uitvoer: één PNG-afbeelding
    - Grootte: standaard `1024x1024`; breedte en hoogte moeten elk minimaal 768 px zijn,
      en het totale aantal pixels mag maximaal 1.048.576 zijn
    - Bewerkingen: één PNG- of JPEG-referentieafbeelding, alleen ondersteund door
      implementaties van `MAI-Image-2.5-Flash` en `MAI-Image-2.5`

    Voor genereren op basis van alleen een prompt kan een aangepaste implementatienaam
    worden gebruikt wanneer alleen het Foundry-eindpunt is geconfigureerd. Voor
    bewerkingen met aangepaste implementatienamen zijn onboarding- of modelmetadata
    vereist, zodat OpenClaw kan verifiëren dat de implementatie is gebaseerd op
    `MAI-Image-2.5-Flash` of `MAI-Image-2.5`.

    De huidige MAI-afbeeldingsmodellen zijn `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` en `MAI-Image-2`. Zie de
    [Microsoft Foundry-plugin](/nl/plugins/reference/microsoft-foundry) voor installatie
    en het gedrag van chatmodellen.

  </Accordion>
  <Accordion title="OpenRouter image models">
    OpenRouter-afbeeldingsgeneratie gebruikt dezelfde `OPENROUTER_API_KEY` en
    wordt gerouteerd via de afbeeldings-API voor chatvoltooiingen van OpenRouter.
    Selecteer OpenRouter-afbeeldingsmodellen met het prefix `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw stuurt `prompt`, `count`, referentieafbeeldingen en met Gemini
    compatibele hints voor `aspectRatio` / `resolution` door naar OpenRouter.
    De huidige ingebouwde snelkoppelingen voor OpenRouter-afbeeldingsmodellen
    omvatten `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` en `openai/gpt-5.4-image-2`. Gebruik
    `action: "list"` om te zien wat uw geconfigureerde plugin beschikbaar stelt.

  </Accordion>
  <Accordion title="fal Krea 2">
    Krea 2-modellen op fal gebruiken het systeemeigen Krea-schema van fal in
    plaats van het algemene `image_size`-schema dat door Flux wordt gebruikt.
    OpenClaw verzendt:

    - `aspect_ratio` voor hints voor de beeldverhouding
    - `creativity`, standaard ingesteld op `medium`
    - `image_style_references` wanneer `image` of `images` wordt opgegeven

    Selecteer Krea 2 Medium voor snellere, expressieve illustraties en Krea 2 Large
    voor tragere, gedetailleerdere fotorealistische beelden en textuurrijke stijlen:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 retourneert momenteel één afbeelding per verzoek. Geef voor Krea de
    voorkeur aan `aspectRatio`; OpenClaw koppelt `size` aan de dichtstbijzijnde
    ondersteunde Krea-beeldverhouding en weigert `resolution` voor Krea in plaats
    van deze te negeren. Gebruik `fal.creativity` wanneer u een systeemeigen
    Krea-creativiteitsniveau wilt:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax-afbeeldingsgeneratie is beschikbaar via beide meegeleverde
    authenticatieroutes van MiniMax:

    - `minimax/image-01` voor configuraties met een API-sleutel
    - `minimax-portal/image-01` voor configuraties met OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    De meegeleverde xAI-provider gebruikt `/v1/images/generations` voor verzoeken
    met alleen een prompt en `/v1/images/edits` wanneer `image` of `images`
    aanwezig is.

    - Modellen: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Aantal: maximaal 4
    - Referenties: één `image` of maximaal drie `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluties: `1K`, `2K`
    - Uitvoer: geretourneerd als door OpenClaw beheerde afbeeldingsbijlagen

    OpenClaw stelt de systeemeigen xAI-opties `quality`, `mask`, `user` en de
    beeldverhouding `auto` bewust niet beschikbaar totdat deze besturingselementen
    deel uitmaken van het gedeelde provideroverschrijdende `image_generate`-contract.

  </Accordion>
</AccordionGroup>

## Voorbeelden

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Gelijkwaardige CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Gelijkwaardige CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Genereren (twee vierkante afbeeldingen)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Twee visuele richtingen voor het pictogram van een rustige productiviteitsapp" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Bewerken (één referentie)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Behoud het onderwerp en vervang de achtergrond door een heldere studio-opstelling" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Bewerken (meerdere referenties)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combineer de identiteit van het personage uit de eerste afbeelding met het kleurenpalet uit de tweede" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea-stijlreferenties">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Een expressief redactioneel portret met dit kleurenpalet en deze drukwerktextuur" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Dezelfde vlaggen `--output-format`, `--background`, `--quality` en
`--openai-moderation` zijn beschikbaar voor `openclaw infer image edit`;
`--openai-background` blijft beschikbaar als een OpenAI-specifieke alias. Meegeleverde providers
anders dan OpenAI bieden momenteel geen expliciete achtergrondregeling, waardoor
`background: "transparent"` voor deze providers als genegeerd wordt gerapporteerd.

## Gerelateerd

- [Overzicht van hulpmiddelen](/nl/tools) - alle beschikbare hulpmiddelen voor agents
- [ComfyUI](/nl/providers/comfy) - lokale configuratie van ComfyUI- en Comfy Cloud-workflows
- [fal](/nl/providers/fal) - configuratie van fal als provider voor afbeeldingen en video
- [Google (Gemini)](/nl/providers/google) - configuratie van Gemini als afbeeldingsprovider
- [Microsoft Foundry-plugin](/nl/plugins/reference/microsoft-foundry) - configuratie van Microsoft Foundry-chat en MAI-afbeeldingen
- [MiniMax](/nl/providers/minimax) - configuratie van MiniMax als afbeeldingsprovider
- [OpenAI](/nl/providers/openai) - configuratie van OpenAI Images als provider
- [Vydra](/nl/providers/vydra) - configuratie van Vydra voor afbeeldingen, video en spraak
- [xAI](/nl/providers/xai) - configuratie van Grok voor afbeeldingen, video, zoeken, code-uitvoering en TTS
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) - configuratie van `imageGenerationModel`
- [Modellen](/nl/concepts/models) - modelconfiguratie en failover
