---
read_when:
    - Video's genereren via de agent
    - Videogeneratieproviders en -modellen configureren
    - Inzicht in de parameters van de tool video_generate
sidebarTitle: Video generation
summary: Genereer video's via video_generate op basis van tekst-, afbeeldings- of videoreferenties met 16 providerbackends
title: Videogeneratie
x-i18n:
    generated_at: "2026-07-12T09:31:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw-agenten genereren video's op basis van tekstprompts, referentieafbeeldingen of
bestaande video's via `video_generate`. Er worden zestien providerbackends
ondersteund; de agent kiest automatisch de juiste op basis van de configuratie en
beschikbare API-sleutels.

<Note>
`video_generate` verschijnt alleen wanneer ten minste één provider voor
videogeneratie beschikbaar is. Als deze ontbreekt in de tools van je agent, stel dan
een API-sleutel van een provider in of configureer `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` heeft drie uitvoeringsmodi, die worden bepaald aan de hand van de
referentie-invoer in de aanroep:

- `generate` - geen referentiemedia (tekst-naar-video).
- `imageToVideo` - een of meer referentieafbeeldingen.
- `videoToVideo` - een of meer referentievideo's.

Providers kunnen elke deelverzameling van deze modi ondersteunen. De tool valideert
de actieve modus vóór verzending en meldt de ondersteunde modi in `action=list`.

## Snel aan de slag

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
  <Step title="De agent een opdracht geven">
    > Genereer een filmische video van 5 seconden waarin een vriendelijke kreeft bij zonsondergang surft.

    De agent roept `video_generate` automatisch aan. Het is niet nodig
    de tool aan een toelatingslijst toe te voegen.

  </Step>
</Steps>

## Hoe asynchrone generatie werkt

Videogeneratie verloopt asynchroon:

1. OpenClaw verzendt de aanvraag naar de provider en retourneert onmiddellijk een taak-id.
2. De provider verwerkt de taak op de achtergrond (doorgaans 30 seconden tot enkele minuten, afhankelijk van de provider en resolutie; trage providers met een wachtrij kunnen actief blijven tot de geconfigureerde time-out).
3. Wanneer de video gereed is, activeert OpenClaw dezelfde sessie met een interne voltooiingsgebeurtenis.
4. De agent meldt dit via de normale zichtbare antwoordmodus van de sessie:
   een automatisch definitief antwoord, of `message(action="send")` wanneer de sessie
   de berichtentool vereist. Als de sessie van de aanvrager inactief is, of het activeren
   ervan mislukt en de gegenereerde media nog steeds ontbreken in het voltooiingsantwoord,
   verzendt OpenClaw de media via een idempotente directe terugvalroute.

Terwijl een taak wordt uitgevoerd, retourneren dubbele aanroepen van `video_generate`
binnen dezelfde sessie de huidige taakstatus in plaats van een nieuwe generatie
te starten. Gebruik `action: "status"` om de status te controleren zonder een nieuwe
generatie te activeren, of gebruik `openclaw tasks list` / `openclaw tasks show <lookup>`
via de CLI (zie [Achtergrondtaken](/nl/automation/tasks)).

Buiten agentuitvoeringen die aan een sessie zijn gekoppeld (bijvoorbeeld bij directe
toolaanroepen), valt de tool terug op inlinegeneratie en retourneert deze het definitieve
mediapad binnen dezelfde beurt.

Gegenereerde videobestanden worden opgeslagen in door OpenClaw beheerde mediaopslag
wanneer de provider bytes retourneert. De standaardlimiet is 16 MB (de gedeelde
medialimiet voor video's); `agents.defaults.mediaMaxMb` verhoogt deze voor grotere
renders. Wanneer een provider ook een URL naar gehoste uitvoer retourneert, levert
OpenClaw die URL in plaats van de taak te laten mislukken als lokale opslag een te
groot bestand weigert.

### Levenscyclus van een taak

| Status      | Betekenis                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `queued`    | Taak aangemaakt; wacht tot de provider deze accepteert.                                                        |
| `running`   | De provider verwerkt de taak (doorgaans 30 seconden tot enkele minuten, afhankelijk van provider en resolutie). |
| `succeeded` | Video gereed; de agent wordt geactiveerd en plaatst deze in het gesprek.                                       |
| `failed`    | Providerfout of time-out; de agent wordt geactiveerd met foutdetails.                                          |

Controleer de status via de CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Ondersteunde providers

| Provider              | Standaardmodel                  | Tekst | Afbeeldingsreferentie                                  | Videoreferentie                                | Authenticatie                            |
| --------------------- | ------------------------------- | :---: | ------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Ja (externe URL)                                       | Ja (externe URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | Maximaal 2 afbeeldingen (alleen I2V-modellen; eerste en laatste frame) | -                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | Maximaal 2 afbeeldingen (eerste en laatste frame via rol) | -                                            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | Maximaal 9 referentieafbeeldingen                      | Maximaal 3 video's                              | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 afbeelding                                           | -                                               | `COMFY_API_KEY` of `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | -                                                      | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 afbeelding; maximaal 9 met Seedance referentie-naar-video | Maximaal 3 video's met Seedance referentie-naar-video | `FAL_KEY`                         |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 afbeelding                                           | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 afbeelding                                           | -                                               | `MINIMAX_API_KEY` of MiniMax OAuth       |
| OpenAI                | `sora-2`                        |   ✓   | 1 afbeelding                                           | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | Maximaal 4 afbeeldingen (eerste/laatste frame of referenties) | -                                          | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Ja (externe URL)                                       | Ja (externe URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 afbeelding                                           | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | Alleen `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 afbeelding (`kling`)                                 | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | Klassiek: 1 eerste frame of 7 referenties; 1.5: 1 frame | Klassiek: 1 video                              | `XAI_API_KEY`                            |

Sommige providers accepteren aanvullende of alternatieve omgevingsvariabelen voor
API-sleutels. Raadpleeg de afzonderlijke [providerpagina's](#related) voor details.

Voer `video_generate action=list` uit om tijdens de uitvoering de beschikbare providers,
modellen en uitvoeringsmodi te bekijken.

### Mogelijkhedenmatrix

Het expliciete moduscontract dat wordt gebruikt door `video_generate`, contracttests en
de gedeelde live-controle:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Huidige gedeelde live-testpaden                                                                                                      |
| ---------- | :--------: | :------------: | :------------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider externe `http(s)`-video-URL's vereist                    |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                           |
| ComfyUI    |     ✓      |       ✓        |       -        | Niet opgenomen in de gedeelde controle; workflowspecifieke dekking valt onder de Comfy-tests                                        |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; systeemeigen DeepInfra-videoschema's zijn tekst-naar-video binnen het Plugin-contract                                   |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` alleen bij gebruik van Seedance referentie-naar-video                                    |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gedeelde `videoToVideo` overgeslagen omdat de huidige buffergebaseerde Gemini/Veo-controle die invoer niet accepteert |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                           |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gedeelde `videoToVideo` overgeslagen omdat dit organisatie-/invoerpad momenteel videobewerkingstoegang bij de provider vereist |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                           |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` overgeslagen omdat deze provider externe `http(s)`-video-URL's vereist                    |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wordt alleen uitgevoerd wanneer het geselecteerde model `runway/gen4_aleph` is            |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                           |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; gedeelde `imageToVideo` overgeslagen omdat de meegeleverde `veo3` alleen tekst ondersteunt en de meegeleverde `kling` een externe afbeeldings-URL vereist |
| xAI        |     ✓      |       ✓        |       ✓        | Klassiek ondersteunt alle modi; Video 1.5 ondersteunt alleen afbeelding-naar-video; externe MP4-invoer houdt `videoToVideo` buiten de gedeelde controle |

## Toolparameters

### Vereist

<ParamField path="prompt" type="string" required>
  Tekstbeschrijving van de te genereren video. Vereist voor `action: "generate"`.
</ParamField>

### Inhoudsinvoer

<ParamField path="image" type="string">Eén referentieafbeelding (pad of URL).</ParamField>
<ParamField path="images" type="string[]">Meerdere referentieafbeeldingen (maximaal 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde lijst met afbeeldingen.
Canonieke waarden: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Eén referentievideo (pad of URL).</ParamField>
<ParamField path="videos" type="string[]">Meerdere referentievideo's (maximaal 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde lijst met video's.
Canonieke waarde: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Eén referentie-audiobestand (pad of URL). Wordt gebruikt voor achtergrondmuziek of als
stemreferentie wanneer de provider audio-invoer ondersteunt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Meerdere referentie-audiobestanden (maximaal 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionele rolhints per positie, parallel aan de gecombineerde lijst met audiobestanden.
Canonieke waarde: `reference_audio`.
</ParamField>

<Note>
Rolhints worden ongewijzigd doorgestuurd naar de provider. Canonieke waarden zijn afkomstig
uit de union `VideoGenerationAssetRole`, maar providers kunnen aanvullende roltekenreeksen
accepteren. `*Roles`-arrays mogen niet meer items bevatten dan de bijbehorende
referentielijst; fouten van één positie leiden tot een duidelijke foutmelding.
Gebruik een lege tekenreeks om een positie niet in te stellen. Stel voor xAI elke afbeeldingsrol in op
`reference_image` om de generatiemodus `reference_images` te gebruiken; laat de
rol weg of gebruik `first_frame` voor beeld-naar-video met één afbeelding.
</Note>

### Stijlregelaars

<ParamField path="aspectRatio" type="string">
  Hint voor de beeldverhouding, zoals `1:1`, `16:9`, `9:16`, `adaptive` of een providerspecifieke waarde. OpenClaw normaliseert niet-ondersteunde waarden per provider of negeert ze.
</ParamField>
<ParamField path="resolution" type="string">Resolutiehint, zoals `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` of een providerspecifieke waarde. OpenClaw normaliseert niet-ondersteunde waarden per provider of negeert ze.</ParamField>
<ParamField path="durationSeconds" type="number">
  Beoogde duur in seconden (afgerond op de dichtstbijzijnde door de provider ondersteunde waarde).
</ParamField>
<ParamField path="size" type="string">Groottehint wanneer de provider deze ondersteunt.</ParamField>
<ParamField path="audio" type="boolean">
  Schakel gegenereerde audio in de uitvoer in wanneer dit wordt ondersteund. Dit is iets anders dan `audioRef*` (invoer).
</ParamField>
<ParamField path="watermark" type="boolean">Schakel het watermerk van de provider in of uit wanneer dit wordt ondersteund.</ParamField>

`adaptive` is een providerspecifieke speciale waarde: deze wordt ongewijzigd doorgestuurd naar
providers die `adaptive` in hun mogelijkheden declareren (BytePlus
Seedance gebruikt dit bijvoorbeeld om de verhouding automatisch te bepalen op basis van de afmetingen
van de invoerafbeelding). Providers die dit niet declareren, vermelden de waarde via
`details.ignoredOverrides` in het hulpmiddelresultaat, zodat zichtbaar is dat deze is genegeerd.

### Geavanceerd

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` retourneert de huidige sessietaak; `"list"` inspecteert providers.
</ParamField>
<ParamField path="model" type="string">Provider-/modeloverschrijving (bijvoorbeeld `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hint voor de uitvoerbestandsnaam.</ParamField>
<ParamField path="timeoutMs" type="number">Optionele time-out voor de providerbewerking in milliseconden. Wanneer deze is weggelaten, gebruikt OpenClaw `agents.defaults.videoGenerationModel.timeoutMs` indien geconfigureerd, en anders de door de plugin-auteur ingestelde standaardwaarde van de provider, als die bestaat.</ParamField>
<ParamField path="providerOptions" type="object">
  Providerspecifieke opties als JSON-object (bijvoorbeeld `{"seed": 42, "draft": true}`).
  Providers die een getypeerd schema declareren, valideren de sleutels en typen; bij onbekende
  sleutels of niet-overeenkomende typen wordt de kandidaat tijdens terugval overgeslagen. Providers zonder
  gedeclareerd schema ontvangen de opties ongewijzigd. Voer `video_generate action=list`
  uit om te zien wat elke provider accepteert.
</ParamField>

<Note>
Niet alle providers ondersteunen alle parameters. OpenClaw normaliseert de duur naar
de dichtstbijzijnde door de provider ondersteunde waarde en wijst vertaalde geometriehints
zoals grootte-naar-beeldverhouding opnieuw toe wanneer een terugvalprovider een ander
bedieningsvlak beschikbaar stelt. Werkelijk niet-ondersteunde overschrijvingen worden naar beste vermogen
genegeerd en als waarschuwingen gerapporteerd in het hulpmiddelresultaat. Harde beperkingen van mogelijkheden
(zoals te veel referentie-invoeritems) leiden vóór indiening tot een fout. Hulpmiddelresultaten
melden de toegepaste instellingen; `details.normalization` legt elke
vertaling van aangevraagd naar toegepast vast.
</Note>

Referentie-invoer bepaalt de uitvoeringsmodus:

- Geen referentiemedia -> `generate`
- Een of meer afbeeldingsreferenties -> `imageToVideo`
- Een of meer videoreferenties -> `videoToVideo`
- Referentie-audio-invoer **verandert** de bepaalde modus niet; deze wordt toegepast
  boven op de modus die door de afbeeldings-/videoreferenties wordt bepaald en werkt alleen
  met providers die `maxInputAudios` declareren.

Gemengde afbeeldings- en videoreferenties vormen geen stabiel gedeeld mogelijkhedenoppervlak.
Gebruik bij voorkeur één referentietype per aanvraag.

#### Terugval en getypeerde opties

Sommige controles van mogelijkheden worden op de terugvallaag uitgevoerd in plaats van aan de grens van het hulpmiddel,
zodat een aanvraag die de limieten van de primaire provider overschrijdt nog steeds
door een geschikte terugvalprovider kan worden uitgevoerd:

- Een actieve kandidaat die geen `maxInputAudios` (of `0`) declareert, wordt overgeslagen wanneer
  de aanvraag audioreferenties bevat; de volgende kandidaat wordt geprobeerd. Dezelfde
  controle geldt voor het aantal afbeeldings- en videoreferenties ten opzichte van
  `maxInputImages`/`maxInputVideos`.
- De `maxDurationSeconds` van de actieve kandidaat ligt onder de aangevraagde `durationSeconds`
  en er is geen lijst `supportedDurationSeconds` gedeclareerd -> overgeslagen.
- De aanvraag bevat `providerOptions` en de actieve kandidaat declareert expliciet
  een getypeerd `providerOptions`-schema -> overgeslagen als opgegeven sleutels
  niet in het schema voorkomen of waardetypen niet overeenkomen. Providers zonder
  gedeclareerd schema ontvangen de opties ongewijzigd (achterwaarts compatibele
  doorgifte). Een provider kan alle provideropties uitschakelen door
  een leeg schema te declareren (`capabilities.providerOptions: {}`), wat
  leidt tot dezelfde overslag als een typeverschil.

De eerste reden voor overslaan in een aanvraag wordt op `warn`-niveau vastgelegd, zodat beheerders zien wanneer
hun primaire provider is overgeslagen; volgende overslagen worden op `debug`-niveau vastgelegd om
lange terugvalketens stil te houden. Als elke kandidaat wordt overgeslagen, bevat de
samengevoegde fout de reden voor het overslaan van elke kandidaat.

## Acties

| Actie      | Wat deze doet                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `generate` | Standaard. Maak een video van de opgegeven prompt en optionele referentie-invoer.                                  |
| `status`   | Controleer de status van de lopende videotaak voor de huidige sessie zonder een nieuwe generatie te starten.      |
| `list`     | Toon beschikbare providers, modellen en hun mogelijkheden.                                                        |

## Modelselectie

OpenClaw bepaalt het model in deze volgorde:

1. **Hulpmiddelparameter `model`** - als de agent er een opgeeft in de aanroep.
2. **`videoGenerationModel.primary`** uit de configuratie.
3. **`videoGenerationModel.fallbacks`** in volgorde.
4. **Automatische detectie** - providers met geldige authenticatie, beginnend met de
   huidige standaardprovider en daarna de overige providers in alfabetische
   volgorde.

Als een provider mislukt, wordt de volgende kandidaat automatisch geprobeerd. Als alle
kandidaten mislukken, bevat de fout details van elke poging.

Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om
alleen de expliciete vermeldingen `model`, `primary` en `fallbacks` te gebruiken.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // optionele overschrijving van de time-out per provideraanvraag voor dit hulpmiddel
      },
    },
  },
}
```

## Opmerkingen per provider

<AccordionGroup>
  <Accordion title="Alibaba">
    Gebruikt het asynchrone eindpunt van DashScope / Model Studio. Referentieafbeeldingen en
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
    T2V-model-id's worden automatisch omgezet naar de bijbehorende I2V-
    variant wanneer een afbeelding wordt opgegeven.

    Ondersteunde `providerOptions`-sleutels: `seed` (getal), `draft` (booleaanse waarde -
    dwingt 480p af), `camera_fixed` (booleaanse waarde).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Vereist de Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (extern, niet meegeleverd). Provider-id: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Gebruikt de uniforme `content[]`-API. Ondersteunt maximaal 2 invoerafbeeldingen
    (`first_frame` + `last_frame`). Alle invoer moet bestaan uit externe `https://`-
    URL's. Stel op elke afbeelding `role: "first_frame"` / `"last_frame"` in of
    geef afbeeldingen positioneel door.

    `aspectRatio: "adaptive"` bepaalt de verhouding automatisch op basis van de invoerafbeelding.
    `audio: true` wordt toegewezen aan `generate_audio`. `providerOptions.seed`
    (getal) wordt doorgestuurd.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Vereist de Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (extern, niet meegeleverd). Provider-id: `byteplus-seedance2`. Modellen:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Gebruikt de uniforme `content[]`-API. Ondersteunt maximaal 9 referentieafbeeldingen,
    3 referentievideo's en 3 referentie-audiobestanden. Alle invoer moet bestaan uit externe
    `https://`-URL's. Stel voor elk item `role` in - ondersteunde waarden:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` bepaalt de verhouding automatisch op basis van de invoerafbeelding.
    `audio: true` wordt toegewezen aan `generate_audio`. `providerOptions.seed`
    (getal) wordt doorgestuurd.

  </Accordion>
  <Accordion title="ComfyUI">
    Workflowgestuurde lokale uitvoering of uitvoering in de cloud. Ondersteunt tekst-naar-video en
    afbeelding-naar-video via de geconfigureerde graaf.
  </Accordion>
  <Accordion title="fal">
    Gebruikt een wachtrijgestuurde stroom voor langlopende taken. OpenClaw wacht standaard maximaal 20
    minuten voordat een nog actieve fal-wachtrijtaak als verlopen wordt
    beschouwd. De meeste fal-videomodellen
    accepteren één afbeeldingsreferentie. Seedance 2.0-modellen voor referentie-naar-video
    accepteren maximaal 9 afbeeldingen, 3 video's en 3 audioreferenties, met
    maximaal 12 referentiebestanden in totaal.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Ondersteunt één afbeeldings- of videoreferentie. Verzoeken om gegenereerde audio worden
    met een waarschuwing genegeerd via de Gemini API-route, omdat die API
    de parameter `generateAudio` afwijst voor de huidige Veo-videogeneratie.
  </Accordion>
  <Accordion title="MiniMax">
    Slechts één afbeeldingsreferentie. MiniMax accepteert de resoluties `768P` en `1080P`;
    verzoeken zoals `720P` worden vóór verzending genormaliseerd naar de
    dichtstbijzijnde ondersteunde waarde.
  </Accordion>
  <Accordion title="OpenAI">
    Alleen de overschrijving van `size` wordt doorgestuurd. Andere stijloverschrijvingen
    (`aspectRatio`, `resolution`, `audio`, `watermark`) worden met
    een waarschuwing genegeerd.
  </Accordion>
  <Accordion title="OpenRouter">
    Gebruikt de asynchrone `/videos`-API van OpenRouter. OpenClaw verzendt de
    taak, bevraagt `polling_url` en downloadt `unsigned_urls` of het
    gedocumenteerde eindpunt voor taakinhoud. De meegeleverde standaardwaarde `google/veo-3.1-fast`
    vermeldt tijdsduren van 4/6/8 seconden, resoluties van `720P`/`1080P` en
    beeldverhoudingen van `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Dezelfde DashScope-backend als Alibaba. Referentie-invoer moet uit externe
    `http(s)`-URL's bestaan; lokale bestanden worden vooraf afgewezen.
  </Accordion>
  <Accordion title="Runway">
    Ondersteunt lokale bestanden via data-URI's. Video-naar-video vereist
    `runway/gen4_aleph`. Uitvoeringen met alleen tekst bieden de beeldverhoudingen
    `16:9` en `9:16`.
  </Accordion>
  <Accordion title="Together">
    Slechts één afbeeldingsreferentie.
  </Accordion>
  <Accordion title="Vydra">
    Gebruikt `https://www.vydra.ai/api/v1` rechtstreeks om omleidingen te vermijden
    waarbij authenticatie verloren gaat. `veo3` wordt alleen voor tekst-naar-video meegeleverd; `kling` vereist
    een externe afbeeldings-URL.
  </Accordion>
  <Accordion title="xAI">
    Het standaardmodel `grok-imagine-video` ondersteunt tekst-naar-video,
    afbeelding-naar-video met één afbeelding als eerste frame, maximaal 7 `reference_image`-invoerwaarden via
    `reference_images` van xAI en externe stromen voor videobewerking/-verlenging. Generatie gebruikt standaard
    `480P`; afbeelding-naar-video met één afbeelding neemt de verhouding van de bron over wanneer
    `aspectRatio` is weggelaten. Videobewerking/-verlenging neemt de geometrie van de invoer over en
    accepteert geen overschrijvingen voor beeldverhouding of resolutie. Verlenging accepteert 2-10
    seconden.

    `grok-imagine-video-1.5` is alleen voor afbeelding-naar-video: geef precies één afbeelding op.
    Het ondersteunt 1-15 seconden en `480P`, `720P` of `1080P`, met standaard
    `480P`; laat `aspectRatio` weg om de verhouding van de bronafbeelding over te nemen. De preview-
    en gedateerde 1.5-identificatoren krijgen dezelfde validatie en worden
    ongewijzigd doorgestuurd.

  </Accordion>
</AccordionGroup>

## Modi voor providermogelijkheden

Het gedeelde contract voor videogeneratie ondersteunt modusspecifieke mogelijkheden
in plaats van alleen platte geaggregeerde limieten. Nieuwe providerimplementaties
moeten bij voorkeur expliciete modusblokken gebruiken:

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

Platte geaggregeerde velden zoals `maxInputImages` en `maxInputVideos` zijn
**niet** voldoende om ondersteuning voor transformatiemodi aan te geven. Providers moeten
`generate`, `imageToVideo` en `videoToVideo` expliciet declareren, zodat livetests,
contracttests en het gedeelde hulpmiddel `video_generate` de ondersteuning
voor modi deterministisch kunnen valideren.

Wanneer één model van een provider bredere ondersteuning voor referentie-invoer heeft dan de
overige modellen, gebruik dan `maxInputImagesByModel`, `maxInputVideosByModel` of
`maxInputAudiosByModel` in plaats van de limiet voor de hele modus te verhogen.

## Livetests

Optionele livedekking voor de gedeelde meegeleverde providers:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-wrapper:

```bash
pnpm test:live:media video
```

Dit livebestand gebruikt standaard reeds geëxporteerde provideromgevingsvariabelen vóór opgeslagen
authenticatieprofielen en voert standaard een releaseveilige rooktest uit:

- `generate` voor elke niet-FAL-provider in de reeks.
- Kreeftenprompt van één seconde.
- Bewerkingslimiet per provider uit
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standaard `180000`).

FAL is optioneel, omdat wachtrijvertraging aan providerzijde de releasetijd kan
domineren:

```bash
pnpm test:live:media video --video-providers fal
```

Stel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` in om ook gedeclareerde
transformatiemodi uit te voeren die de gedeelde reeks veilig met lokale media kan testen:

- `imageToVideo` wanneer `capabilities.imageToVideo.enabled`.
- `videoToVideo` wanneer `capabilities.videoToVideo.enabled` en het
  provider/model lokale video-invoer vanuit een buffer accepteert in de gedeelde
  reeks.

Momenteel dekt het gedeelde livepad voor `videoToVideo` alleen `runway` wanneer u
`runway/gen4_aleph` selecteert.

## Configuratie

Stel het standaardmodel voor videogeneratie in uw OpenClaw-configuratie in:

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
- [Achtergrondtaken](/nl/automation/tasks) - taakregistratie voor asynchrone videogeneratie
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
- [Overzicht van hulpmiddelen](/nl/tools)
- [Vydra](/nl/providers/vydra)
- [xAI](/nl/providers/xai)
