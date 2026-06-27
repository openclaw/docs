---
read_when:
    - Afbeeldingen genereren of bewerken via de agent
    - Afbeeldingsgeneratieproviders en -modellen configureren
    - Inzicht in de parameters van de tool image_generate
sidebarTitle: Image generation
summary: Genereer en bewerk afbeeldingen via image_generate in OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Afbeeldingsgeneratie
x-i18n:
    generated_at: "2026-06-27T18:27:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Het `image_generate`-tool laat de agent afbeeldingen maken en bewerken met je
geconfigureerde providers. In chatsessies wordt afbeeldinggeneratie asynchroon
uitgevoerd: OpenClaw registreert een achtergrondtaak, retourneert de taak-id
direct en wekt de agent wanneer de provider klaar is. De voltooiingsagent volgt
de normale zichtbare-antwoordmodus van de sessie: automatische levering van het
eindantwoord wanneer dit is geconfigureerd, of `message(action="send")` wanneer
de sessie het berichtentool vereist. Als de aanvragende sessie inactief is of
de actieve wake mislukt, en er nog gegenereerde afbeeldingen ontbreken in het
voltooiingsantwoord, verzendt OpenClaw een idempotente directe fallback met
alleen de ontbrekende afbeeldingen.

<Note>
Het tool verschijnt alleen wanneer ten minste een provider voor
afbeeldinggeneratie beschikbaar is. Als je `image_generate` niet ziet in de
tools van je agent, configureer dan `agents.defaults.imageGenerationModel`, stel
een provider-API-sleutel in, of meld je aan met OpenAI ChatGPT/Codex OAuth.
</Note>

## Snel starten

<Steps>
  <Step title="Authenticatie configureren">
    Stel een API-sleutel in voor ten minste een provider (bijvoorbeeld `OPENAI_API_KEY`,
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

    ChatGPT/Codex OAuth gebruikt dezelfde `openai/gpt-image-2`-modelreferentie. Wanneer een
    `openai` OAuth-profiel is geconfigureerd, routeert OpenClaw afbeeldingsverzoeken
    via dat OAuth-profiel in plaats van eerst
    `OPENAI_API_KEY` te proberen. Expliciete `models.providers.openai`-configuratie (API-sleutel,
    aangepaste/Azure-basis-URL) kiest weer voor de directe OpenAI Images API-route.

  </Step>
  <Step title="Vraag het de agent">
    _"Genereer een afbeelding van een vriendelijke robotmascotte."_

    De agent roept `image_generate` automatisch aan. Geen allow-listing voor tools
    nodig - het is standaard ingeschakeld wanneer een provider beschikbaar is. Het tool
    retourneert een achtergrondtaak-id, waarna de voltooiingsagent de gegenereerde
    bijlage via het `message`-tool verzendt wanneer deze klaar is.

  </Step>
</Steps>

<Warning>
Voor OpenAI-compatibele LAN-eindpunten zoals LocalAI behoud je de aangepaste
`models.providers.openai.baseUrl` en kies je expliciet voor
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Private en
interne afbeeldingseindpunten blijven standaard geblokkeerd.
</Warning>

## Veelgebruikte routes

| Doel                                                 | Modelreferentie                                   | Authenticatie                          |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI-afbeeldinggeneratie met API-facturering       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-afbeeldinggeneratie met Codex-abonnementsauthenticatie | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI PNG/WebP met transparante achtergrond         | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` of OpenAI Codex OAuth |
| DeepInfra-afbeeldinggeneratie                       | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 expressieve/stijlgestuurde generatie      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter-afbeeldinggeneratie                      | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM-afbeeldinggeneratie                         | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI-afbeeldinggeneratie            | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` of Entra ID     |
| Google Gemini-afbeeldinggeneratie                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` of `GOOGLE_API_KEY`   |

Hetzelfde `image_generate`-tool verwerkt tekst-naar-afbeelding en bewerking met
referentieafbeeldingen. Gebruik `image` voor een referentie of `images` voor
meerdere referenties. Voor Krea 2-modellen op fal worden die referenties
verzonden als stijlreferenties in plaats van bewerkingsinvoer.
Door de provider ondersteunde uitvoerhints zoals `quality`, `outputFormat` en
`background` worden doorgestuurd wanneer beschikbaar en gerapporteerd als
genegeerd wanneer een provider ze niet ondersteunt. Gebundelde ondersteuning
voor transparante achtergronden is OpenAI-specifiek; andere providers kunnen
PNG-alfa nog steeds behouden als hun backend die uitvoert.

## Ondersteunde providers

| Provider          | Standaardmodel                         | Ondersteuning voor bewerken        | Authenticatie                                        |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Ja (1 afbeelding, workflow-geconfigureerd) | `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` voor cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Ja (1 afbeelding)                  | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Ja (modelspecifieke limieten)      | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Ja                                 | `GEMINI_API_KEY` of `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Ja (tot 5 invoerafbeeldingen)      | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Ja (alleen MAI-Image-2.5-modellen) | `AZURE_OPENAI_API_KEY` of Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Ja (onderwerpreferentie)           | `MINIMAX_API_KEY` of MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Ja (tot 4 afbeeldingen)            | `OPENAI_API_KEY` of OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Ja (tot 5 invoerafbeeldingen)      | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Nee                                | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Ja (tot 5 afbeeldingen)            | `XAI_API_KEY`                                         |

Gebruik `action: "list"` om beschikbare providers en modellen tijdens runtime te bekijken:

```text
/tool image_generate action=list
```

Gebruik `action: "status"` om de actieve afbeeldinggeneratietaak voor de
huidige sessie te bekijken:

```text
/tool image_generate action=status
```

## Providermogelijkheden

| Mogelijkheid          | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Genereren (maximumaantal) | Door workflow gedefinieerd | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Bewerken / referentie | 1 afbeelding (workflow) | 1 afbeelding | Flux: 1; GPT: 10; Krea-stijlreferenties: 10; NB2: 14 | Tot 5 afbeeldingen | 1 afbeelding      | 1 afbeelding (onderwerpreferentie) | Tot 5 afbeeldingen | -     | Tot 5 afbeeldingen |
| Grootteregeling       | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Tot 4K         | -     | -              |
| Beeldverhouding       | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Resolutie (1K/2K/4K)  | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Toolparameters

<ParamField path="prompt" type="string" required>
  Prompt voor afbeeldinggeneratie. Vereist voor `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Gebruik `"status"` om de actieve sessietaak te bekijken of `"list"` om
  beschikbare providers en modellen tijdens runtime te bekijken.
</ParamField>
<ParamField path="model" type="string">
  Provider-/modeloverride (bijv. `openai/gpt-image-2`). Gebruik
  `openai/gpt-image-1.5` voor transparante OpenAI-achtergronden.
</ParamField>
<ParamField path="image" type="string">
  Pad of URL van een enkele referentieafbeelding voor bewerkingsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Meerdere referentieafbeeldingen voor bewerkingsmodus of stijlreferentiemodellen (tot 10
  via het gedeelde tool; providerspecifieke limieten blijven gelden).
</ParamField>
<ParamField path="size" type="string">
  Groottehint: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Beeldverhouding: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Providers
  valideren hun modelspecifieke subset.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Resolutiehint.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Kwaliteitshint wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Uitvoerformaathint wanneer de provider dit ondersteunt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Achtergrondhint wanneer de provider dit ondersteunt. Gebruik `transparent` met
  `outputFormat: "png"` of `"webp"` voor providers die transparantie ondersteunen.
</ParamField>
<ParamField path="count" type="number">Aantal te genereren afbeeldingen (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Optionele time-out voor providerverzoeken in milliseconden. Wanneer Codex
  `image_generate` via dynamische tools aanroept, overschrijft deze waarde per
  aanroep nog steeds de geconfigureerde standaardwaarde en wordt deze begrensd op 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="openai" type="object">
  Alleen OpenAI-hints: `background`, `moderation`, `outputCompression` en `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Creativiteitsregeling voor fal Krea 2. Standaard is `medium`.
</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. Wanneer een fallbackprovider
een vergelijkbare geometrieoptie ondersteunt in plaats van exact de gevraagde,
herleidt OpenClaw dit voor verzending naar de dichtstbijzijnde ondersteunde
grootte, beeldverhouding of resolutie.
Niet-ondersteunde uitvoerhints worden weggelaten voor providers die geen
ondersteuning declareren en gerapporteerd in het toolresultaat. Toolresultaten
rapporteren de toegepaste instellingen; `details.normalization` legt elke
vertaling van aangevraagd naar toegepast vast.
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

### Volgorde voor providerselectie

OpenClaw probeert providers in deze volgorde:

1. **`model`-parameter** uit de toolaanroep (als de agent er een opgeeft).
2. **`imageGenerationModel.primary`** uit configuratie.
3. **`imageGenerationModel.fallbacks`** op volgorde.
4. **Automatische detectie** - alleen providerstandaarden met auth-ondersteuning:
   - eerst de huidige standaardprovider;
   - resterende geregistreerde providers voor beeldgeneratie in provider-id-volgorde.

Als een provider faalt (auth-fout, snelheidslimiet, enz.), wordt de volgende geconfigureerde
kandidaat automatisch geprobeerd. Als alles faalt, bevat de fout details
van elke poging.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Een `model`-override per aanroep probeert alleen die provider/dat model en gaat
    niet door met de geconfigureerde primaire/fallback- of automatisch gedetecteerde providers.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Een providerstandaard komt alleen in de kandidatenlijst wanneer OpenClaw
    die provider daadwerkelijk kan authenticeren. Stel
    `agents.defaults.mediaGenerationAutoProviderFallback: false` in om alleen
    expliciete `model`-, `primary`- en `fallbacks`-items te gebruiken.
  </Accordion>
  <Accordion title="Timeouts">
    Stel `agents.defaults.imageGenerationModel.timeoutMs` in voor trage image-
    backends. Een `timeoutMs`-toolparameter per aanroep overschrijft de geconfigureerde
    standaard, en geconfigureerde standaarden overschrijven door Plugin-auteurs ingestelde provider-
    standaarden. Door Google en OpenRouter gehoste imageproviders gebruiken
    standaarden van 180 seconden; Microsoft Foundry MAI-, xAI- en Azure OpenAI-beeldgeneratie gebruiken
    600 seconden. Dynamische Codex-toolaanroepen gebruiken een `image_generate`-
    bridgestandaard van 120 seconden en respecteren hetzelfde timeoutbudget wanneer geconfigureerd, begrensd door
    OpenClaw's maximale dynamische-toolbridge van 600000 ms.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Gebruik `action: "list"` om de momenteel geregistreerde providers,
    hun standaardmodellen en hints voor auth-env-vars te inspecteren.
  </Accordion>
</AccordionGroup>

### Afbeeldingen bewerken

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI en xAI ondersteunen het bewerken van referentieafbeeldingen. Krea 2-modellen op fal gebruiken
dezelfde `image`- / `images`-velden als stijlreferenties in plaats van bewerkingsinvoer. Geef
een pad of URL naar een referentieafbeelding door:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google en xAI ondersteunen maximaal 5 referentieafbeeldingen via de
`images`-parameter. fal ondersteunt 1 referentieafbeelding voor Flux image-to-image, maximaal
10 voor GPT Image 2-bewerkingen, maximaal 10 stijlreferenties voor Krea 2 en maximaal
14 voor Nano Banana 2-bewerkingen. Microsoft Foundry, MiniMax en ComfyUI ondersteunen er 1.

## Provider-diepgaande uitleg

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    OpenAI-beeldgeneratie gebruikt standaard `openai/gpt-image-2`. Als een
    `openai` OAuth-profiel is geconfigureerd, hergebruikt OpenClaw hetzelfde
    OAuth-profiel dat door Codex-chatmodellen met abonnement wordt gebruikt en verzendt het
    afbeeldingsverzoek via de Codex Responses-backend. Verouderde Codex-basis-
    URL's zoals `https://chatgpt.com/backend-api` worden gecanoniseerd naar
    `https://chatgpt.com/backend-api/codex` voor afbeeldingsverzoeken. OpenClaw
    valt voor dat verzoek **niet** stil terug op `OPENAI_API_KEY` -
    configureer `models.providers.openai` expliciet met een API-sleutel, aangepaste basis-URL
    of Azure-endpoint om routering via de directe OpenAI Images API af te dwingen.

    De modellen `openai/gpt-image-1.5`, `openai/gpt-image-1` en
    `openai/gpt-image-1-mini` kunnen nog steeds expliciet worden geselecteerd. Gebruik
    `gpt-image-1.5` voor PNG/WebP-uitvoer met transparante achtergrond; de huidige
    `gpt-image-2` API weigert `background: "transparent"`.

    `gpt-image-2` ondersteunt zowel tekst-naar-afbeeldinggeneratie als
    bewerking van referentieafbeeldingen via dezelfde `image_generate`-tool.
    OpenClaw stuurt `prompt`, `count`, `size`, `quality`, `outputFormat`
    en referentieafbeeldingen door naar OpenAI. OpenAI ontvangt
    `aspectRatio` of `resolution` **niet** rechtstreeks; waar mogelijk zet OpenClaw
    die om naar een ondersteunde `size`, anders rapporteert de tool ze als
    genegeerde overrides.

    OpenAI-specifieke opties staan onder het `openai`-object:

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
    transparante uitvoer vereist `outputFormat` `png` of `webp` en een
    OpenAI-beeldmodel dat transparantie ondersteunt. OpenClaw routeert standaard
    `gpt-image-2`-verzoeken met transparante achtergrond naar `gpt-image-1.5`.
    `openai.outputCompression` geldt voor JPEG/WebP-uitvoer en wordt genegeerd
    voor PNG-uitvoer.

    De bovenliggende `background`-hint is providerneutraal en wordt momenteel
    naar hetzelfde OpenAI `background`-aanvraagveld gemapt wanneer de OpenAI-provider
    is geselecteerd. Providers die geen achtergrondondersteuning declareren, retourneren
    deze in `ignoredOverrides` in plaats van de niet-ondersteunde parameter te ontvangen.

    Zie
    [Azure OpenAI-endpoints](/nl/providers/openai#azure-openai-endpoints) om OpenAI-beeldgeneratie via een Azure OpenAI-implementatie
    te routeren in plaats van via `api.openai.com`.

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Microsoft Foundry-beeldgeneratie gebruikt geïmplementeerde MAI-imageimplementatienamen
    onder de providerprefix `microsoft-foundry/`. Er is geen providerbreed
    standaardmodel omdat de MAI API je implementatienaam verwacht in het
    `model`-veld:

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

    De provider gebruikt de MAI API van Microsoft Foundry, niet de OpenAI Images API:

    - Generatie-endpoint: `/mai/v1/images/generations`
    - Bewerkingsendpoint: `/mai/v1/images/edits`
    - Auth: `AZURE_OPENAI_API_KEY` / provider-API-sleutel, of Entra ID via `az login`
    - Uitvoer: één PNG-afbeelding
    - Grootte: standaard `1024x1024`; breedte en hoogte moeten elk minstens 768 px zijn,
      en het totaal aantal pixels mag maximaal 1.048.576 zijn
    - Bewerkingen: één PNG- of JPEG-referentieafbeelding, alleen ondersteund door
      `MAI-Image-2.5-Flash`- en `MAI-Image-2.5`-implementaties

    Generatie met alleen prompt kan een aangepaste implementatienaam gebruiken met alleen het
    Foundry-endpoint geconfigureerd. Bewerkingen met aangepaste implementatienamen hebben
    onboarding-/modelmetadata nodig zodat OpenClaw kan verifiëren dat de implementatie
    wordt ondersteund door `MAI-Image-2.5-Flash` of `MAI-Image-2.5`.

    Huidige MAI-beeldmodellen zijn `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` en `MAI-Image-2`. Zie
    [Microsoft Foundry-Plugin](/nl/plugins/reference/microsoft-foundry) voor configuratie
    en gedrag van chatmodellen.

  </Accordion>
  <Accordion title="OpenRouter image models">
    OpenRouter-beeldgeneratie gebruikt dezelfde `OPENROUTER_API_KEY` en
    routeert via OpenRouter's chat completions image API. Selecteer
    OpenRouter-beeldmodellen met de prefix `openrouter/`:

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

    OpenClaw stuurt `prompt`, `count`, referentieafbeeldingen en
    Gemini-compatibele `aspectRatio`- / `resolution`-hints door naar OpenRouter.
    Huidige ingebouwde snelkoppelingen voor OpenRouter-beeldmodellen zijn onder meer
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` en `openai/gpt-5.4-image-2`. Gebruik
    `action: "list"` om te zien wat je geconfigureerde Plugin beschikbaar stelt.

  </Accordion>
  <Accordion title="fal Krea 2">
    Krea 2-modellen op fal gebruiken fal's native Krea-schema in plaats van het generieke
    `image_size`-schema dat door Flux wordt gebruikt. OpenClaw verzendt:

    - `aspect_ratio` voor hints voor beeldverhouding
    - `creativity`, standaard `medium`
    - `image_style_references` wanneer `image` of `images` zijn opgegeven

    Selecteer Krea 2 Medium voor snellere expressieve illustratie en Krea 2 Large
    voor tragere, gedetailleerdere fotorealistische en getextureerde looks:

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

    Krea 2 retourneert momenteel één afbeelding per verzoek. Geef voor Krea de voorkeur aan `aspectRatio`;
    OpenClaw mapt `size` naar de dichtstbijzijnde ondersteunde Krea-beeldverhouding en
    weigert `resolution` voor Krea in plaats van die te laten vallen. Gebruik `fal.creativity`
    wanneer je een native Krea-creativiteitsniveau wilt:

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
    MiniMax-beeldgeneratie is beschikbaar via beide gebundelde MiniMax-
    auth-paden:

    - `minimax/image-01` voor setups met API-sleutel
    - `minimax-portal/image-01` voor OAuth-setups

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    De gebundelde xAI-provider gebruikt `/v1/images/generations` voor verzoeken
    met alleen prompt en `/v1/images/edits` wanneer `image` of `images` aanwezig is.

    - Modellen: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Aantal: maximaal 4
    - Referenties: één `image` of maximaal vijf `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluties: `1K`, `2K`
    - Uitvoer: geretourneerd als door OpenClaw beheerde afbeeldingsbijlagen

    OpenClaw stelt bewust geen xAI-native `quality`, `mask`,
    `user` of extra alleen-native beeldverhoudingen beschikbaar totdat die bedieningselementen
    bestaan in het gedeelde provider-overstijgende `image_generate`-contract.

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

Equivalente CLI:

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

Equivalente CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Dezelfde vlaggen `--output-format`, `--background`, `--quality` en
`--openai-moderation` zijn beschikbaar op `openclaw infer image edit`;
`--openai-background` blijft een OpenAI-specifieke alias. Gebundelde providers
anders dan OpenAI declareren momenteel geen expliciete achtergrondregeling, dus
`background: "transparent"` wordt voor hen als genegeerd gerapporteerd.

## Gerelateerd

- [Overzicht van tools](/nl/tools) - alle beschikbare agenttools
- [ComfyUI](/nl/providers/comfy) - installatie van lokale ComfyUI- en Comfy Cloud-workflows
- [fal](/nl/providers/fal) - installatie van fal als beeld- en videoprovider
- [Google (Gemini)](/nl/providers/google) - installatie van Gemini als beeldprovider
- [Microsoft Foundry-plugin](/nl/plugins/reference/microsoft-foundry) - installatie van Microsoft Foundry-chat en MAI-afbeeldingen
- [MiniMax](/nl/providers/minimax) - installatie van MiniMax als beeldprovider
- [OpenAI](/nl/providers/openai) - installatie van OpenAI Images-provider
- [Vydra](/nl/providers/vydra) - installatie van Vydra voor beeld, video en spraak
- [xAI](/nl/providers/xai) - installatie van Grok voor beeld, video, zoeken, code-uitvoering en TTS
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) - configuratie voor `imageGenerationModel`
- [Modellen](/nl/concepts/models) - modelconfiguratie en failover
