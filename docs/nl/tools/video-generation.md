---
read_when:
    - Video's genereren via de agent
    - Videogeneratieproviders en -modellen configureren
    - De parameters van de tool video_generate begrijpen
sidebarTitle: Video generation
summary: Genereer video's via video_generate op basis van tekst-, afbeeldings- of videoreferenties voor 16 providerbackends
title: Videogeneratie
x-i18n:
    generated_at: "2026-05-05T01:51:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw-agents kunnen video's genereren uit tekstprompts, referentieafbeeldingen of
bestaande video's. Zestien providerbackends worden ondersteund, elk met
verschillende modelopties, invoermodi en functiesets. De agent kiest de
juiste provider automatisch op basis van je configuratie en beschikbare API-
sleutels.

<Note>
De tool `video_generate` verschijnt alleen wanneer ten minste één video-generatieprovider
beschikbaar is. Als je deze niet ziet in je agenttools, stel dan een
provider-API-sleutel in of configureer `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt videogeneratie als drie runtime-modi:

- `generate` — tekst-naar-videoverzoeken zonder referentiemedia.
- `imageToVideo` — het verzoek bevat één of meer referentieafbeeldingen.
- `videoToVideo` — het verzoek bevat één of meer referentievideo's.

Providers kunnen elke subset van deze modi ondersteunen. De tool valideert de
actieve modus vóór indiening en rapporteert ondersteunde modi in `action=list`.

## Snel aan de slag

<Steps>
  <Step title="Configureer authenticatie">
    Stel een API-sleutel in voor een ondersteunde provider:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Kies een standaardmodel (optioneel)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Vraag het de agent">
    > Genereer een cinematische video van 5 seconden van een vriendelijke kreeft die surft bij zonsondergang.

    De agent roept `video_generate` automatisch aan. Er is geen allowlist
    voor tools nodig.

  </Step>
</Steps>

## Hoe async generatie werkt

Videogeneratie is asynchroon. Wanneer de agent `video_generate` aanroept in een
sessie:

1. OpenClaw dient het verzoek in bij de provider en retourneert onmiddellijk een taak-id.
2. De provider verwerkt de taak op de achtergrond (meestal 30 seconden tot 5 minuten, afhankelijk van de provider en resolutie).
3. Wanneer de video klaar is, wekt OpenClaw dezelfde sessie met een interne voltooiingsgebeurtenis.
4. De agent informeert de gebruiker en voegt de voltooide video toe. In groeps-/kanaalchats
   die zichtbare levering alleen via berichtentools gebruiken, geeft de agent het
   resultaat door via de berichtentool in plaats van dat OpenClaw het rechtstreeks plaatst.

Terwijl een taak loopt, retourneren dubbele `video_generate`-aanroepen in dezelfde
sessie de huidige taakstatus in plaats van een andere generatie te starten.
Gebruik `openclaw tasks list` of `openclaw tasks show <taskId>` om de
voortgang vanuit de CLI te controleren.

Buiten agentruns met sessieondersteuning (bijvoorbeeld directe toolaanroepen)
valt de tool terug op inline generatie en retourneert het uiteindelijke mediapad
in dezelfde beurt.

Gegenereerde videobestanden worden opgeslagen in door OpenClaw beheerde mediaopslag wanneer
de provider bytes retourneert. De standaard opslaglimiet voor gegenereerde video's volgt
de limiet voor videomedia, en `agents.defaults.mediaMaxMb` verhoogt deze voor
grotere renders. Wanneer een provider ook een gehoste uitvoer-URL retourneert, kan OpenClaw
die URL leveren in plaats van de taak te laten mislukken als lokale persistentie
een te groot bestand weigert.

### Taaklevenscyclus

| Status      | Betekenis                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Taak aangemaakt, wachtend tot de provider deze accepteert.                                      |
| `running`   | Provider verwerkt de taak (meestal 30 seconden tot 5 minuten, afhankelijk van provider en resolutie). |
| `succeeded` | Video is klaar; de agent wordt gewekt en plaatst deze in het gesprek.                          |
| `failed`    | Providerfout of time-out; de agent wordt gewekt met foutdetails.                               |

Controleer de status vanuit de CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Als er al een videotaak `queued` of `running` is voor de huidige sessie,
retourneert `video_generate` de bestaande taakstatus in plaats van een nieuwe
te starten. Gebruik `action: "status"` om expliciet te controleren zonder een nieuwe
generatie te triggeren.

## Ondersteunde providers

| Provider              | Standaardmodel                  | Tekst | Afbeeldingsref                                      | Videoref                                        | Authenticatie                            |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ja (externe URL)                                     | Ja (externe URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Tot 2 afbeeldingen (alleen I2V-modellen; eerste + laatste frame) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Tot 2 afbeeldingen (eerste + laatste frame via rol)  | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Tot 9 referentieafbeeldingen                         | Tot 3 video's                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 afbeelding                                         | —                                               | `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 afbeelding; tot 9 met Seedance reference-to-video  | Tot 3 video's met Seedance reference-to-video   | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 afbeelding                                         | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 afbeelding                                         | —                                               | `MINIMAX_API_KEY` of MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 afbeelding                                         | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Tot 4 afbeeldingen (eerste/laatste frame of referenties) | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ja (externe URL)                                     | Ja (externe URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 afbeelding                                         | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 afbeelding                                         | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 afbeelding (`kling`)                               | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 eerste-frameafbeelding of tot 7 `reference_image`s | 1 video                                         | `XAI_API_KEY`                            |

Sommige providers accepteren aanvullende of alternatieve API-sleutelomgevingsvariabelen. Zie
de afzonderlijke [providerpagina's](#related) voor details.

Voer `video_generate action=list` uit om beschikbare providers, modellen en
runtime-modi tijdens runtime te inspecteren.

### Capaciteitsmatrix

Het expliciete moduscontract dat wordt gebruikt door `video_generate`, contracttests en
de gedeelde live-sweep:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Gedeelde live-lanes vandaag                                                                                                             |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider externe `http(s)`-video-URL's nodig heeft                   |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Niet in de gedeelde sweep; workflowspecifieke dekking hoort bij Comfy-tests                                                             |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; native DeepInfra-videoschema's zijn tekst-naar-video in het gebundelde contract                                             |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` alleen bij gebruik van Seedance reference-to-video                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gedeelde `videoToVideo` overgeslagen omdat de huidige buffer-backed Gemini/Veo-sweep die invoer niet accepteert |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gedeelde `videoToVideo` overgeslagen omdat dit organisatie-/invoerpad momenteel provider-side inpaint/remix-toegang nodig heeft |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider externe `http(s)`-video-URL's nodig heeft                   |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` draait alleen wanneer het geselecteerde model `runway/gen4_aleph` is                         |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; gedeelde `imageToVideo` overgeslagen omdat gebundelde `veo3` alleen tekst ondersteunt en gebundelde `kling` een externe afbeeldings-URL vereist |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider momenteel een externe MP4-URL nodig heeft                   |

## Toolparameters

### Vereist

<ParamField path="prompt" type="string" required>
  Tekstbeschrijving van de video die moet worden gegenereerd. Vereist voor `action: "generate"`.
</ParamField>

### Contentinvoer

<ParamField path="image" type="string">Eén referentieafbeelding (pad of URL).</ParamField>
<ParamField path="images" type="string[]">Meerdere referentieafbeeldingen (tot 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde afbeeldingenlijst.
Canonieke waarden: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Eén referentievideo (pad of URL).</ParamField>
<ParamField path="videos" type="string[]">Meerdere referentievideo's (tot 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde videolijst.
Canonieke waarde: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Eén referentieaudio (pad of URL). Wordt gebruikt voor achtergrondmuziek of stemreferentie
wanneer de provider audio-invoer ondersteunt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Meerdere referentieaudio's (tot 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde audiolijst.
Canonieke waarde: `reference_audio`.
</ParamField>

<Note>
Rolhints worden ongewijzigd doorgestuurd naar de provider. Canonieke waarden komen uit
de union `VideoGenerationAssetRole`, maar providers kunnen aanvullende
rolstrings accepteren. `*Roles`-arrays mogen niet meer vermeldingen bevatten dan de
bijbehorende referentielijst; fouten van één positie verschil mislukken met een duidelijke fout.
Gebruik een lege string om een positie niet in te stellen. Stel voor xAI elke afbeeldingsrol in op
`reference_image` om de generatiemodus `reference_images` te gebruiken; laat de
rol weg of gebruik `first_frame` voor beeld-naar-video met één afbeelding.
</Note>

### Stijlinstellingen

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, of `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, of `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Doelduur in seconden (afgerond naar de dichtstbijzijnde door de provider ondersteunde waarde).
</ParamField>
<ParamField path="size" type="string">Groottehint wanneer de provider dit ondersteunt.</ParamField>
<ParamField path="audio" type="boolean">
  Schakel gegenereerde audio in de uitvoer in wanneer ondersteund. Verschilt van `audioRef*` (invoer).
</ParamField>
<ParamField path="watermark" type="boolean">Schakel watermerk van de provider in of uit wanneer ondersteund.</ParamField>

`adaptive` is een provider-specifieke sentinel: deze wordt ongewijzigd doorgestuurd naar
providers die `adaptive` in hun mogelijkheden declareren (bijv. BytePlus
Seedance gebruikt dit om de verhouding automatisch te detecteren uit de afmetingen van de invoerafbeelding
). Providers die dit niet declareren, tonen de waarde via
`details.ignoredOverrides` in het toolresultaat, zodat het wegvallen zichtbaar is.

### Geavanceerd

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retourneert de huidige sessietaak; `"list"` inspecteert providers.
</ParamField>
<ParamField path="model" type="string">Provider/model-overschrijving (bijv. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerverzoek in milliseconden.</ParamField>
<ParamField path="providerOptions" type="object">
  Provider-specifieke opties als JSON-object (bijv. `{"seed": 42, "draft": true}`).
  Providers die een getypeerd schema declareren, valideren de sleutels en typen; onbekende
  sleutels of mismatches slaan de kandidaat over tijdens fallback. Providers zonder een
  gedeclareerd schema ontvangen de opties ongewijzigd. Voer `video_generate action=list` uit
  om te zien wat elke provider accepteert.
</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw normaliseert de duur naar
de dichtstbijzijnde door de provider ondersteunde waarde, en zet vertaalde geometriehints
zoals grootte-naar-beeldverhouding om wanneer een fallbackprovider een ander
besturingsoppervlak biedt. Echt niet-ondersteunde overschrijvingen worden naar beste vermogen
genegeerd en als waarschuwingen in het toolresultaat gerapporteerd. Harde capaciteitslimieten
(zoals te veel referentie-invoer) mislukken vóór indiening. Toolresultaten
rapporteren toegepaste instellingen; `details.normalization` legt eventuele
vertaling van aangevraagd naar toegepast vast.
</Note>

Referentie-invoer selecteert de runtime-modus:

- Geen referentiemedia → `generate`
- Een afbeeldingsreferentie → `imageToVideo`
- Een videoreferentie → `videoToVideo`
- Referentieaudio-invoer **verandert niet** de opgeloste modus; deze wordt toegepast bovenop
  de modus die de afbeeldings-/videoreferenties selecteren, en werkt alleen
  met providers die `maxInputAudios` declareren.

Gemengde afbeeldings- en videoreferenties vormen geen stabiel gedeeld capaciteitsoppervlak.
Gebruik bij voorkeur één referentietype per verzoek.

#### Fallback en getypeerde opties

Sommige capaciteitscontroles worden toegepast op de fallbacklaag in plaats van aan de
toolgrens, zodat een verzoek dat de limieten van de primaire provider overschrijdt
nog steeds kan worden uitgevoerd op een capabele fallback:

- Actieve kandidaat die geen `maxInputAudios` (of `0`) declareert, wordt overgeslagen wanneer
  het verzoek audioreferenties bevat; de volgende kandidaat wordt geprobeerd.
- `maxDurationSeconds` van de actieve kandidaat ligt onder de gevraagde `durationSeconds`
  zonder gedeclareerde lijst `supportedDurationSeconds` → overgeslagen.
- Verzoek bevat `providerOptions` en de actieve kandidaat declareert expliciet
  een getypeerd `providerOptions`-schema → overgeslagen als geleverde sleutels
  niet in het schema staan of waardetypen niet overeenkomen. Providers zonder een
  gedeclareerd schema ontvangen opties ongewijzigd (achterwaarts compatibele
  doorvoer). Een provider kan alle provideropties uitschakelen door
  een leeg schema te declareren (`capabilities.providerOptions: {}`), wat
  dezelfde overslag veroorzaakt als een typemismatch.

De eerste reden voor overslaan in een verzoek wordt op `warn` gelogd, zodat operators zien wanneer
hun primaire provider is gepasseerd; daaropvolgende overslagen worden op `debug` gelogd om
lange fallbackketens stil te houden. Als elke kandidaat wordt overgeslagen, bevat de
geaggregeerde fout de reden voor overslaan voor elke kandidaat.

## Acties

| Actie      | Wat deze doet                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `generate` | Standaard. Maak een video op basis van de gegeven prompt en optionele referentie-invoer.                  |
| `status`   | Controleer de status van de lopende videotaak voor de huidige sessie zonder een nieuwe generatie te starten. |
| `list`     | Toon beschikbare providers, modellen en hun mogelijkheden.                                                |

## Modelselectie

OpenClaw lost het model in deze volgorde op:

1. **toolparameter `model`** — als de agent er een opgeeft in de aanroep.
2. **`videoGenerationModel.primary`** uit de configuratie.
3. **`videoGenerationModel.fallbacks`** op volgorde.
4. **Automatische detectie** — providers met geldige authenticatie, beginnend met de
   huidige standaardprovider, daarna resterende providers in alfabetische
   volgorde.

Als een provider faalt, wordt de volgende kandidaat automatisch geprobeerd. Als alle
kandidaten falen, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om
alleen de expliciete vermeldingen `model`, `primary` en `fallbacks` te gebruiken.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Providernotities

<AccordionGroup>
  <Accordion title="Alibaba">
    Gebruikt het asynchrone endpoint van DashScope / Model Studio. Referentieafbeeldingen en
    -video's moeten externe `http(s)`-URL's zijn.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider-id: `byteplus`.

    Modellen: `seedance-1-0-pro-250528` (standaard),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-modellen (`*-t2v-*`) accepteren geen afbeeldingsinvoer; I2V-modellen en
    algemene `*-pro-*`-modellen ondersteunen één referentieafbeelding (eerste
    frame). Geef de afbeelding positioneel door of stel `role: "first_frame"` in.
    T2V-model-ID's worden automatisch omgeschakeld naar de bijbehorende I2V-
    variant wanneer een afbeelding wordt verstrekt.

    Ondersteunde sleutels voor `providerOptions`: `seed` (getal), `draft` (boolean —
    forceert 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Vereist de Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-id: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Gebruikt de uniforme API `content[]`. Ondersteunt maximaal 2 invoerafbeeldingen
    (`first_frame` + `last_frame`). Alle invoer moet externe `https://`-
    URL's zijn. Stel `role: "first_frame"` / `"last_frame"` in voor elke afbeelding, of
    geef afbeeldingen positioneel door.

    `aspectRatio: "adaptive"` detecteert automatisch de verhouding uit de invoerafbeelding.
    `audio: true` wordt toegewezen aan `generate_audio`. `providerOptions.seed`
    (getal) wordt doorgestuurd.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Vereist de Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-id: `byteplus-seedance2`. Modellen:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Gebruikt de uniforme API `content[]`. Ondersteunt tot 9 referentieafbeeldingen,
    3 referentievideo's en 3 referentieaudio's. Alle invoer moet externe
    `https://`-URL's zijn. Stel `role` in voor elk asset — ondersteunde waarden:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecteert automatisch de verhouding uit de invoerafbeelding.
    `audio: true` wordt toegewezen aan `generate_audio`. `providerOptions.seed`
    (getal) wordt doorgestuurd.

  </Accordion>
  <Accordion title="ComfyUI">
    Workflowgestuurde lokale of cloud-uitvoering. Ondersteunt tekst-naar-video en
    beeld-naar-video via de geconfigureerde graaf.
  </Accordion>
  <Accordion title="fal">
    Gebruikt een wachtrijgebaseerde flow voor langlopende taken. De meeste fal-videomodellen
    accepteren één afbeeldingsreferentie. Seedance 2.0 reference-to-video-
    modellen accepteren tot 9 afbeeldingen, 3 video's en 3 audioreferenties, met
    maximaal 12 referentiebestanden in totaal.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Ondersteunt één afbeeldings- of één videoreferentie.
  </Accordion>
  <Accordion title="MiniMax">
    Alleen één afbeeldingsreferentie.
  </Accordion>
  <Accordion title="OpenAI">
    Alleen de overschrijving `size` wordt doorgestuurd. Andere stijloverschrijvingen
    (`aspectRatio`, `resolution`, `audio`, `watermark`) worden genegeerd met
    een waarschuwing.
  </Accordion>
  <Accordion title="OpenRouter">
    Gebruikt OpenRouter's asynchrone API `/videos`. OpenClaw dient de
    taak in, pollt `polling_url`, en downloadt ofwel `unsigned_urls` of het
    gedocumenteerde endpoint voor taakinhoud. De gebundelde standaard `google/veo-3.1-fast`
    adverteert duren van 4/6/8 seconden, resoluties `720P`/`1080P`, en
    beeldverhoudingen `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Dezelfde DashScope-backend als Alibaba. Referentie-invoer moet bestaan uit externe
    `http(s)`-URL's; lokale bestanden worden vooraf geweigerd.
  </Accordion>
  <Accordion title="Runway">
    Ondersteunt lokale bestanden via data-URI's. Video-naar-video vereist
    `runway/gen4_aleph`. Runs met alleen tekst bieden beeldverhoudingen
    `16:9` en `9:16`.
  </Accordion>
  <Accordion title="Together">
    Alleen één afbeeldingsreferentie.
  </Accordion>
  <Accordion title="Vydra">
    Gebruikt `https://www.vydra.ai/api/v1` rechtstreeks om redirects te vermijden
    die authenticatie laten vallen. `veo3` is gebundeld als alleen tekst-naar-video; `kling` vereist
    een externe afbeeldings-URL.
  </Accordion>
  <Accordion title="xAI">
    Ondersteunt tekst-naar-video, beeld-naar-video met één eerste-frameafbeelding, tot 7
    `reference_image`-invoeritems via xAI `reference_images`, en externe
    videobewerkings-/verlengingsflows.
  </Accordion>
</AccordionGroup>

## Providercapaciteitsmodi

Het gedeelde contract voor videogeneratie ondersteunt modusspecifieke mogelijkheden
in plaats van alleen vlakke geaggregeerde limieten. Nieuwe providerimplementaties
moeten de voorkeur geven aan expliciete modusblokken:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Vlakke geaggregeerde velden zoals `maxInputImages` en `maxInputVideos` zijn
**niet** genoeg om ondersteuning voor transformatiemodi aan te kondigen. Providers moeten
`generate`, `imageToVideo` en `videoToVideo` expliciet declareren, zodat live-
tests, contracttests en de gedeelde `video_generate`-tool
modusondersteuning deterministisch kunnen valideren.

Wanneer één model in een provider bredere ondersteuning voor referentie-invoer heeft dan de
rest, gebruik dan `maxInputImagesByModel`, `maxInputVideosByModel` of
`maxInputAudiosByModel` in plaats van de modusbrede limiet te verhogen.

## Live-tests

Meld je aan voor live-dekking voor de gedeelde gebundelde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media video
```

Dit live-bestand laadt ontbrekende provider-env-vars uit `~/.profile`, geeft standaard
de voorkeur aan live/env-API-sleutels boven opgeslagen auth-profielen, en voert standaard een
releaseveilige smoke-test uit:

- `generate` voor elke niet-FAL-provider in de sweep.
- Lobster-prompt van één seconde.
- Operatielimiet per provider uit
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`).

FAL is opt-in omdat wachtrijlatentie aan providerzijde de releasetijd kan
domineren:

```bash
pnpm test:live:media video --video-providers fal
```

Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde
transformatiemodi uit te voeren die de gedeelde sweep veilig met lokale media kan testen:

- `imageToVideo` wanneer `capabilities.imageToVideo.enabled`.
- `videoToVideo` wanneer `capabilities.videoToVideo.enabled` en de
  provider/het model lokale video-invoer met bufferbacking accepteert in de gedeelde
  sweep.

Vandaag dekt de gedeelde live-lane voor `videoToVideo` alleen `runway` wanneer je
`runway/gen4_aleph` selecteert.

## Configuratie

Stel het standaardmodel voor videogeneratie in je OpenClaw-configuratie in:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Of via de CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Gerelateerd

- [Alibaba Model Studio](/nl/providers/alibaba)
- [Achtergrondtaken](/nl/automation/tasks) — taaktracking voor asynchrone videogeneratie
- [BytePlus](/nl/concepts/model-providers#byteplus-international)
- [ComfyUI](/nl/providers/comfy)
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults)
- [fal](/nl/providers/fal)
- [Google (Gemini)](/nl/providers/google)
- [MiniMax](/nl/providers/minimax)
- [Modellen](/nl/concepts/models)
- [OpenAI](/nl/providers/openai)
- [Qwen](/nl/providers/qwen)
- [Runway](/nl/providers/runway)
- [Together AI](/nl/providers/together)
- [Tools-overzicht](/nl/tools)
- [Vydra](/nl/providers/vydra)
- [xAI](/nl/providers/xai)
