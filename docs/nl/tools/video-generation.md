---
read_when:
    - Video's genereren via de agent
    - Videogeneratieproviders en -modellen configureren
    - De parameters van de video_generate-tool begrijpen
sidebarTitle: Video generation
summary: Genereer video's via video_generate op basis van tekst-, afbeeldings- of videoreferenties over 16 aanbiederbackends
title: Videogeneratie
x-i18n:
    generated_at: "2026-05-11T20:55:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1dbeea0393150c1495bcc0a9acc68a57b99d919f3134fb17820f22cfe05e90
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw-agenten kunnen video's genereren uit tekstprompts, referentieafbeeldingen of
bestaande video's. Zestien provider-backends worden ondersteund, elk met
verschillende modelopties, invoermodi en functiesets. De agent kiest
automatisch de juiste provider op basis van je configuratie en beschikbare API-
sleutels.

<Note>
De tool `video_generate` verschijnt alleen wanneer er minstens één provider
voor videogeneratie beschikbaar is. Als je deze niet in je agent-tools ziet,
stel dan een provider-API-sleutel in of configureer `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt videogeneratie als drie runtime-modi:

- `generate` - tekst-naar-video-aanvragen zonder referentiemedia.
- `imageToVideo` - aanvraag bevat één of meer referentieafbeeldingen.
- `videoToVideo` - aanvraag bevat één of meer referentievideo's.

Providers kunnen elke subset van die modi ondersteunen. De tool valideert de
actieve modus vóór indiening en rapporteert ondersteunde modi in `action=list`.

## Snelstart

<Steps>
  <Step title="Authenticatie configureren">
    Stel een API-sleutel in voor een ondersteunde provider:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Een standaardmodel kiezen (optioneel)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Vraag het de agent">
    > Genereer een cinematografische video van 5 seconden van een vriendelijke kreeft die surft bij zonsondergang.

    De agent roept `video_generate` automatisch aan. Er is geen allowlisting
    van tools nodig.

  </Step>
</Steps>

## Hoe asynchrone generatie werkt

Videogeneratie is asynchroon. Wanneer de agent `video_generate` aanroept in een
sessie:

1. OpenClaw dient de aanvraag in bij de provider en retourneert onmiddellijk een taak-id.
2. De provider verwerkt de taak op de achtergrond (meestal 30 seconden tot enkele minuten, afhankelijk van de provider en resolutie; trage providers met wachtrijen kunnen lopen tot aan de geconfigureerde time-out).
3. Wanneer de video klaar is, wekt OpenClaw dezelfde sessie met een interne voltooiingsgebeurtenis.
4. De agent vertelt het de gebruiker en voegt de voltooide video toe. In groeps-/kanaalchats
   die zichtbare aflevering alleen via bericht-tools gebruiken, geeft de agent
   het resultaat door via de bericht-tool in plaats van dat OpenClaw het direct plaatst.

Terwijl een taak actief is, retourneren dubbele `video_generate`-aanroepen in
dezelfde sessie de huidige taakstatus in plaats van een andere generatie te
starten. Gebruik `openclaw tasks list` of `openclaw tasks show <taskId>` om
voortgang vanuit de CLI te controleren.

Buiten agent-runs met sessieondersteuning (bijvoorbeeld directe tool-aanroepen)
valt de tool terug op inline generatie en retourneert het uiteindelijke mediapad
in dezelfde beurt.

Gegenereerde videobestanden worden opgeslagen onder door OpenClaw beheerde mediaopslag wanneer
de provider bytes retourneert. De standaard opslaglimiet voor gegenereerde video's volgt
de limiet voor videomedia, en `agents.defaults.mediaMaxMb` verhoogt die voor
grotere renders. Wanneer een provider ook een gehoste uitvoer-URL retourneert, kan OpenClaw
die URL leveren in plaats van de taak te laten mislukken als lokale persistentie
een te groot bestand weigert.

### Taaklevenscyclus

| Status      | Betekenis                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Taak aangemaakt, wacht tot de provider deze accepteert.                                                |
| `running`   | Provider is aan het verwerken (meestal 30 seconden tot enkele minuten, afhankelijk van provider en resolutie). |
| `succeeded` | Video klaar; de agent wordt gewekt en plaatst deze in het gesprek.                                     |
| `failed`    | Providerfout of time-out; de agent wordt gewekt met foutdetails.                                       |

Controleer status vanuit de CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Als er al een videotaak `queued` of `running` is voor de huidige sessie,
retourneert `video_generate` de bestaande taakstatus in plaats van een nieuwe
te starten. Gebruik `action: "status"` om expliciet te controleren zonder een
nieuwe generatie te starten.

## Ondersteunde providers

| Provider              | Standaardmodel                  | Tekst | Afbeeldingsref.                                     | Videoref.                                      | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ja (externe URL)                                     | Ja (externe URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Tot 2 afbeeldingen (alleen I2V-modellen; eerste + laatste frame) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Tot 2 afbeeldingen (eerste + laatste frame via rol)  | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Tot 9 referentieafbeeldingen                         | Tot 3 video's                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 afbeelding                                         | -                                               | `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 afbeelding; tot 9 met Seedance referentie-naar-video | Tot 3 video's met Seedance referentie-naar-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 afbeelding                                         | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 afbeelding                                         | -                                               | `MINIMAX_API_KEY` of MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 afbeelding                                         | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Tot 4 afbeeldingen (eerste/laatste frame of referenties) | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ja (externe URL)                                     | Ja (externe URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 afbeelding                                         | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 afbeelding                                         | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 afbeelding (`kling`)                               | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 eerste-frame-afbeelding of tot 7 `reference_image`s | 1 video                                         | `XAI_API_KEY`                            |

Sommige providers accepteren aanvullende of alternatieve API-sleutel-env-vars. Zie
individuele [providerpagina's](#related) voor details.

Voer `video_generate action=list` uit om beschikbare providers, modellen en
runtime-modi tijdens runtime te inspecteren.

### Capaciteitenmatrix

Het expliciete moduscontract dat wordt gebruikt door `video_generate`, contracttests en
de gedeelde live sweep:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Gedeelde live lanes vandaag                                                                                                             |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider externe `http(s)`-video-URL's nodig heeft                  |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | Niet in de gedeelde sweep; workflowspecifieke dekking leeft bij Comfy-tests                                                             |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; native DeepInfra-videoschema's zijn tekst-naar-video in het gebundelde contract                                             |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` alleen bij gebruik van Seedance referentie-naar-video                                        |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gedeelde `videoToVideo` overgeslagen omdat de huidige buffer-backed Gemini/Veo-sweep die invoer niet accepteert |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gedeelde `videoToVideo` overgeslagen omdat dit org-/invoerpad momenteel provider-side inpaint/remix-toegang nodig heeft |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider externe `http(s)`-video-URL's nodig heeft                  |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` draait alleen wanneer het geselecteerde model `runway/gen4_aleph` is                        |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; gedeelde `imageToVideo` overgeslagen omdat gebundelde `veo3` alleen tekst is en gebundelde `kling` een externe afbeeldings-URL vereist |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider momenteel een externe MP4-URL nodig heeft                  |

## Toolparameters

### Vereist

<ParamField path="prompt" type="string" required>
  Tekstbeschrijving van de te genereren video. Vereist voor `action: "generate"`.
</ParamField>

### Contentinvoer

<ParamField path="image" type="string">Eén referentieafbeelding (pad of URL).</ParamField>
<ParamField path="images" type="string[]">Meerdere referentieafbeeldingen (maximaal 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde afbeeldingenlijst.
Canonieke waarden: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Eén referentievideo (pad of URL).</ParamField>
<ParamField path="videos" type="string[]">Meerdere referentievideo's (maximaal 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde videolijst.
Canonieke waarde: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Eén referentieaudio (pad of URL). Gebruikt voor achtergrondmuziek of een
stemreferentie wanneer de provider audio-invoer ondersteunt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Meerdere referentieaudio's (maximaal 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde audiolijst.
Canonieke waarde: `reference_audio`.
</ParamField>

<Note>
Rolhints worden ongewijzigd naar de provider doorgestuurd. Canonieke waarden komen uit
de `VideoGenerationAssetRole`-union, maar providers kunnen aanvullende
roltekenreeksen accepteren. `*Roles`-arrays mogen niet meer items bevatten dan de
bijbehorende referentielijst; fouten van één positie verschil mislukken met een duidelijke foutmelding.
Gebruik een lege tekenreeks om een positie niet in te stellen. Stel voor xAI elke afbeeldingsrol in op
`reference_image` om de generatiemodus `reference_images` te gebruiken; laat de
rol weg of gebruik `first_frame` voor afbeelding-naar-video met één afbeelding.
</Note>

### Stijlregelaars

<ParamField path="aspectRatio" type="string">
  Hint voor beeldverhouding, zoals `1:1`, `16:9`, `9:16`, `adaptive`, of een providerspecifieke waarde. OpenClaw normaliseert of negeert niet-ondersteunde waarden per provider.
</ParamField>
<ParamField path="resolution" type="string">Resolutiehint zoals `480P`, `720P`, `768P`, `1080P`, `4K`, of een providerspecifieke waarde. OpenClaw normaliseert of negeert niet-ondersteunde waarden per provider.</ParamField>
<ParamField path="durationSeconds" type="number">
  Doelduur in seconden (afgerond naar de dichtstbijzijnde door de provider ondersteunde waarde).
</ParamField>
<ParamField path="size" type="string">Groottehint wanneer de provider dit ondersteunt.</ParamField>
<ParamField path="audio" type="boolean">
  Schakel gegenereerde audio in de uitvoer in wanneer dit wordt ondersteund. Verschilt van `audioRef*` (invoer).
</ParamField>
<ParamField path="watermark" type="boolean">Schakel watermerken door de provider in of uit wanneer dit wordt ondersteund.</ParamField>

`adaptive` is een providerspecifieke sentinel: deze wordt ongewijzigd doorgestuurd naar
providers die `adaptive` in hun mogelijkheden declareren (bijv. BytePlus
Seedance gebruikt dit om de verhouding automatisch te detecteren uit de afmetingen
van de invoerafbeelding). Providers die dit niet declareren, tonen de waarde via
`details.ignoredOverrides` in het toolresultaat, zodat het negeren zichtbaar is.

### Geavanceerd

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retourneert de huidige sessietaak; `"list"` inspecteert providers.
</ParamField>
<ParamField path="model" type="string">Provider-/modeloverride (bijv. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hint voor uitvoerbestandsnaam.</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor providerbewerking in milliseconden. Wanneer weggelaten, gebruikt OpenClaw `agents.defaults.videoGenerationModel.timeoutMs` als dit is geconfigureerd.</ParamField>
<ParamField path="providerOptions" type="object">
  Providerspecifieke opties als JSON-object (bijv. `{"seed": 42, "draft": true}`).
  Providers die een getypt schema declareren, valideren de sleutels en typen; onbekende
  sleutels of afwijkingen slaan de kandidaat over tijdens terugval. Providers zonder een
  gedeclareerd schema ontvangen de opties ongewijzigd. Voer `video_generate action=list`
  uit om te zien wat elke provider accepteert.
</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw normaliseert duur naar
de dichtstbijzijnde door de provider ondersteunde waarde, en wijst vertaalde geometriehints
zoals grootte-naar-beeldverhouding opnieuw toe wanneer een terugvalprovider een ander
bedieningsoppervlak beschikbaar stelt. Echt niet-ondersteunde overrides worden naar beste vermogen
genegeerd en als waarschuwingen in het toolresultaat gerapporteerd. Harde capaciteitslimieten
(zoals te veel referentie-invoer) mislukken vóór verzending. Toolresultaten
rapporteren toegepaste instellingen; `details.normalization` legt elke
gevraagd-naar-toegepast-vertaling vast.
</Note>

Referentie-invoer selecteert de runtime-modus:

- Geen referentiemedia → `generate`
- Enige afbeeldingsreferentie → `imageToVideo`
- Enige videoreferentie → `videoToVideo`
- Referentieaudio-invoer **wijzigt niet** de opgeloste modus; deze wordt toegepast
  boven op de modus die de afbeeldings-/videoreferenties selecteren, en werkt alleen
  met providers die `maxInputAudios` declareren.

Gemengde afbeeldings- en videoreferenties zijn geen stabiel gedeeld capaciteitsoppervlak.
Gebruik bij voorkeur één referentietype per aanvraag.

#### Terugval en getypte opties

Sommige capaciteitscontroles worden toegepast in de terugvallaag in plaats van aan de
toolgrens, zodat een aanvraag die de limieten van de primaire provider overschrijdt
nog steeds kan draaien op een geschikte terugval:

- Actieve kandidaat die geen `maxInputAudios` declareert (of `0`) wordt overgeslagen wanneer
  de aanvraag audioreferenties bevat; de volgende kandidaat wordt geprobeerd.
- `maxDurationSeconds` van de actieve kandidaat ligt onder de gevraagde `durationSeconds`
  zonder gedeclareerde lijst `supportedDurationSeconds` → overgeslagen.
- Aanvraag bevat `providerOptions` en de actieve kandidaat declareert expliciet
  een getypt `providerOptions`-schema → overgeslagen als opgegeven sleutels
  niet in het schema staan of waardetypen niet overeenkomen. Providers zonder een
  gedeclareerd schema ontvangen opties ongewijzigd (achterwaarts compatibele
  doorvoer). Een provider kan alle provideropties uitschakelen door
  een leeg schema te declareren (`capabilities.providerOptions: {}`), waardoor
  dezelfde overslag ontstaat als bij een typeafwijking.

De eerste overslagreden in een aanvraag wordt op `warn` gelogd, zodat operators zien wanneer
hun primaire provider is overgeslagen; daaropvolgende overslagen worden op `debug` gelogd om
lange terugvalketens stil te houden. Als elke kandidaat wordt overgeslagen, bevat de
samengevoegde fout de overslagreden voor elke kandidaat.

## Acties

| Actie      | Wat het doet                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `generate` | Standaard. Maak een video van de opgegeven prompt en optionele referentie-invoer.                             |
| `status`   | Controleer de status van de lopende videotaak voor de huidige sessie zonder een andere generatie te starten. |
| `list`     | Toon beschikbare providers, modellen en hun mogelijkheden.                                                    |

## Modelselectie

OpenClaw lost het model in deze volgorde op:

1. **`model`-toolparameter** - als de agent er een in de aanroep opgeeft.
2. **`videoGenerationModel.primary`** uit de configuratie.
3. **`videoGenerationModel.fallbacks`** op volgorde.
4. **Automatische detectie** - providers met geldige verificatie, beginnend met de
   huidige standaardprovider, daarna de resterende providers in alfabetische
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
    Gebruikt het asynchrone eindpunt van DashScope / Model Studio. Referentieafbeeldingen en
    video's moeten externe `http(s)`-URL's zijn.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider-id: `byteplus`.

    Modellen: `seedance-1-0-pro-250528` (standaard),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-modellen (`*-t2v-*`) accepteren geen afbeeldingsinvoer; I2V-modellen en
    algemene `*-pro-*`-modellen ondersteunen één referentieafbeelding (eerste
    frame). Geef de afbeelding positioneel door of stel `role: "first_frame"` in.
    T2V-model-id's worden automatisch omgeschakeld naar de bijbehorende I2V-
    variant wanneer een afbeelding wordt opgegeven.

    Ondersteunde `providerOptions`-sleutels: `seed` (number), `draft` (boolean -
    dwingt 480p af), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Vereist de [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin. Provider-id: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Gebruikt de uniforme `content[]`-API. Ondersteunt maximaal 2 invoerafbeeldingen
    (`first_frame` + `last_frame`). Alle invoer moet bestaan uit externe `https://`-
    URL's. Stel `role: "first_frame"` / `"last_frame"` in op elke afbeelding, of
    geef afbeeldingen positioneel door.

    `aspectRatio: "adaptive"` detecteert de verhouding automatisch uit de invoerafbeelding.
    `audio: true` wordt gekoppeld aan `generate_audio`. `providerOptions.seed`
    (number) wordt doorgestuurd.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Vereist de [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin. Provider-id: `byteplus-seedance2`. Modellen:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Gebruikt de uniforme `content[]`-API. Ondersteunt maximaal 9 referentieafbeeldingen,
    3 referentievideo's en 3 referentieaudio's. Alle invoer moet bestaan uit externe
    `https://`-URL's. Stel `role` in op elk asset - ondersteunde waarden:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` detecteert de verhouding automatisch uit de invoerafbeelding.
    `audio: true` wordt gekoppeld aan `generate_audio`. `providerOptions.seed`
    (number) wordt doorgestuurd.

  </Accordion>
  <Accordion title="ComfyUI">
    Workflow-gestuurde lokale of cloud-uitvoering. Ondersteunt tekst-naar-video en
    afbeelding-naar-video via de geconfigureerde grafiek.
  </Accordion>
  <Accordion title="fal">
    Gebruikt een wachtrijgestuurde stroom voor langlopende taken. OpenClaw wacht standaard maximaal 20
    minuten voordat een actieve fal-wachtrijtaak als verlopen wordt beschouwd. De meeste fal-videomodellen
    accepteren een enkele afbeeldingsreferentie. Seedance 2.0 reference-to-video-
    modellen accepteren maximaal 9 afbeeldingen, 3 video's en 3 audioreferenties, met
    hoogstens 12 referentiebestanden in totaal.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Ondersteunt een afbeeldings- of videoreferentie. Verzoeken voor gegenereerde audio worden
    genegeerd met een waarschuwing op het Gemini API-pad, omdat die API de parameter
    `generateAudio` voor de huidige Veo-videogeneratie weigert.
  </Accordion>
  <Accordion title="MiniMax">
    Alleen een enkele afbeeldingsreferentie. MiniMax accepteert resoluties van `768P` en `1080P`;
    verzoeken zoals `720P` worden vóór indiening genormaliseerd naar de dichtstbijzijnde
    ondersteunde waarde.
  </Accordion>
  <Accordion title="OpenAI">
    Alleen de `size`-override wordt doorgestuurd. Andere stijloverrides
    (`aspectRatio`, `resolution`, `audio`, `watermark`) worden genegeerd met
    een waarschuwing.
  </Accordion>
  <Accordion title="OpenRouter">
    Gebruikt de asynchrone `/videos`-API van OpenRouter. OpenClaw dient de
    taak in, pollt `polling_url` en downloadt ofwel `unsigned_urls` of het
    gedocumenteerde eindpunt voor taakinhoud. De meegeleverde standaard `google/veo-3.1-fast`
    adverteert duurwaarden van 4/6/8 seconden, resoluties van `720P`/`1080P` en
    beeldverhoudingen van `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Dezelfde DashScope-backend als Alibaba. Referentie-invoer moet bestaan uit externe
    `http(s)`-URL's; lokale bestanden worden vooraf geweigerd.
  </Accordion>
  <Accordion title="Runway">
    Ondersteunt lokale bestanden via data-URI's. Video-naar-video vereist
    `runway/gen4_aleph`. Tekst-only uitvoeringen bieden beeldverhoudingen van `16:9` en `9:16`.
  </Accordion>
  <Accordion title="Together">
    Alleen een enkele afbeeldingsreferentie.
  </Accordion>
  <Accordion title="Vydra">
    Gebruikt `https://www.vydra.ai/api/v1` rechtstreeks om redirects te vermijden
    die authenticatie laten vallen. `veo3` wordt alleen meegeleverd als tekst-naar-video; `kling` vereist
    een externe afbeeldings-URL.
  </Accordion>
  <Accordion title="xAI">
    Ondersteunt tekst-naar-video, afbeelding-naar-video met een enkele eerste frame-afbeelding, maximaal 7
    `reference_image`-invoeren via xAI `reference_images`, en externe
    videobewerkings-/uitbreidingsstromen.
  </Accordion>
</AccordionGroup>

## Modi voor providermogelijkheden

Het gedeelde contract voor videogeneratie ondersteunt modusspecifieke mogelijkheden
in plaats van alleen vlakke geaggregeerde limieten. Nieuwe providerimplementaties
moeten expliciete modusblokken verkiezen:

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
**niet** genoeg om ondersteuning voor transformatiemodi te adverteren. Providers moeten
`generate`, `imageToVideo` en `videoToVideo` expliciet declareren zodat live
tests, contracttests en de gedeelde tool `video_generate` modusondersteuning
deterministisch kunnen valideren.

Wanneer één model in een provider bredere ondersteuning voor referentie-invoer heeft dan de
rest, gebruik dan `maxInputImagesByModel`, `maxInputVideosByModel` of
`maxInputAudiosByModel` in plaats van de modusbrede limiet te verhogen.

## Live tests

Opt-in live dekking voor de gedeelde meegeleverde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media video
```

Dit livebestand laadt ontbrekende provider-env-vars uit `~/.profile`, verkiest
standaard live/env-API-sleutels boven opgeslagen auth-profielen, en voert standaard een
release-veilige smoke uit:

- `generate` voor elke niet-FAL-provider in de sweep.
- Prompt van een seconde met kreeft.
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
  provider/het model buffergebaseerde lokale video-invoer accepteert in de gedeelde
  sweep.

Vandaag dekt de gedeelde livebaan `videoToVideo` alleen `runway` wanneer je
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
- [Achtergrondtaken](/nl/automation/tasks) - taaktracking voor asynchrone videogeneratie
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
- [Tooloverzicht](/nl/tools)
- [Vydra](/nl/providers/vydra)
- [xAI](/nl/providers/xai)
