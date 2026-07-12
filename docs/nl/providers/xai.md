---
read_when:
    - Je wilt Grok-modellen gebruiken in OpenClaw
    - Je configureert xAI-authenticatie of model-id's
summary: Gebruik xAI Grok-modellen in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T09:21:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw levert een gebundelde `xai`-providerplugin voor Grok-modellen. De
aanbevolen methode is Grok OAuth met een geschikt SuperGrok- of X Premium-
abonnement. Gateway, configuratie, routering en tools blijven lokaal; alleen
Grok-verzoeken gaan naar de API van xAI.

Voor OAuth is geen xAI-API-sleutel of de Grok Build-app vereist. xAI kan Grok
Build nog steeds op het toestemmingsscherm tonen, omdat OpenClaw de gedeelde
OAuth-client van xAI gebruikt.

## Installatie

<Steps>
  <Step title="Nieuwe installatie">
    Voer de onboarding uit met installatie van de daemon en kies vervolgens
    xAI/Grok OAuth bij de stap voor model/authenticatie:

    ```bash
    openclaw onboard --install-daemon
    ```

    Selecteer op een VPS of via SSH rechtstreeks xAI OAuth; dit gebruikt
    verificatie met een apparaatcode en vereist geen localhost-callback:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Bestaande installatie">
    Meld u alleen aan bij xAI; voer niet de volledige onboarding opnieuw uit
    enkel om Grok te verbinden:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Stel Grok afzonderlijk in als standaardmodel:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Voer de volledige onboarding alleen opnieuw uit als u bewust de Gateway,
    daemon, het kanaal, de werkruimte of andere installatiekeuzes wilt wijzigen.

  </Step>
  <Step title="Methode met API-sleutel">
    Installatie met een API-sleutel werkt nog steeds voor sleutels van xAI
    Console en voor media-interfaces die providerconfiguratie op basis van een
    sleutel vereisen:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Een model kiezen">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw gebruikt de xAI Responses API als het gebundelde xAI-transport. Dezelfde
referentie van `openclaw models auth login --provider xai --method oauth` of
`--method api-key` voorziet ook `web_search` (provider-id `grok`), `x_search`,
`code_execution`, spraak/transcriptie en het genereren van afbeeldingen/video's
door xAI van toegang. Als u een xAI-sleutel opslaat onder
`plugins.entries.xai.config.webSearch.apiKey`, gebruikt de gebundelde
xAI-modelprovider deze ook als terugvaloptie.
</Note>

## Problemen met OAuth oplossen

- Gebruik voor SSH, Docker, VPS of andere externe installaties
  `openclaw models auth login --provider xai --method oauth`; dit gebruikt
  verificatie met een apparaatcode, niet een localhost-callback.
- Als het aanmelden slaagt maar Grok niet het standaardmodel is, voert u
  `openclaw models set xai/grok-4.3` uit.
- Bekijk opgeslagen xAI-authenticatieprofielen:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI bepaalt welke accounts OAuth-API-tokens kunnen ontvangen. Als een account
  niet in aanmerking komt, gebruikt u de methode met API-sleutel of controleert
  u het abonnement bij xAI.

<Tip>
Gebruik `xai-oauth` wanneer u zich aanmeldt via SSH, Docker of een VPS. OpenClaw
toont een URL en korte code; voltooi de aanmelding in een lokale browser terwijl
het externe proces xAI raadpleegt voor de voltooide tokenuitwisseling.
</Tip>

## Ingebouwde catalogus

Selecteerbare id's in modelkiezers. De plugin herkent voor bestaande
configuraties nog steeds oudere id's van Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast en Grok Code; zie
[verouderde compatibiliteit en veranderende aliassen](#legacy-compatibility-and-moving-aliases).

| Familie        | Model-id's                                                    |
| -------------- | ------------------------------------------------------------- |
| Grok 4.5       | `grok-4.5` (aliassen: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                              |
| Grok 4.3       | `grok-4.3` (aliassen: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`    |

<Tip>
Gebruik `grok-4.5` voor algemene chats, programmeerwerk en agentisch werk waar
dit beschikbaar is. Grok 4.3 blijft de regionaal veilige standaard voor de
installatie; `grok-build-0.1` en beide gedateerde Grok 4.20-varianten blijven
selecteerbaar.
</Tip>

## Functieondersteuning

De gebundelde plugin koppelt ondersteunde xAI-API's aan de gedeelde provider- en
toolcontracten van OpenClaw. Mogelijkheden die niet binnen het gedeelde contract
passen, worden hieronder of onder bekende beperkingen vermeld.

| xAI-mogelijkheid                  | OpenClaw-interface                      | Status                                                               |
| --------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses                  | `xai/<model>`-modelprovider              | Ja                                                                   |
| Webzoekopdracht aan serverzijde   | `web_search`-provider `grok`             | Ja                                                                   |
| Zoeken op X aan serverzijde       | `x_search`-tool                          | Ja                                                                   |
| Code-uitvoering aan serverzijde   | `code_execution`-tool                    | Ja                                                                   |
| Afbeeldingen                      | `image_generate`                         | Ja                                                                   |
| Video's                           | `video_generate`                         | Volledige klassieke workflow; Video 1.5 van afbeelding naar video    |
| Batchgewijze tekst-naar-spraak    | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                   |
| Streaming-TTS                     | -                                        | Nog niet geïmplementeerd door de xAI-provider                        |
| Batchgewijze spraak-naar-tekst    | `tools.media.audio`-mediabegrip           | Ja                                                                   |
| Streaming-spraak-naar-tekst       | Voice Call `streaming.provider: "xai"`   | Ja                                                                   |
| Realtime spraak                   | -                                        | Nog niet beschikbaar; vereist een ander sessie-/WebSocket-contract   |
| Bestanden / batches               | Alleen compatibiliteit met generieke model-API | Geen volwaardige OpenClaw-tool                                 |

<Note>
OpenClaw gebruikt de REST-API's van xAI voor afbeeldingen/video's/TTS/STT voor
mediageneratie en batchtranscriptie, de streaming-STT-WebSocket van xAI voor
live transcriptie van spraakoproepen en de Responses API voor chat-, zoek- en
code-uitvoeringstools.
</Note>

### Compatibiliteit met de verouderde snelle modus

`/fast on` of `agents.defaults.models["xai/<model>"].params.fastMode: true`
herschrijft oudere xAI-configuraties nog steeds als volgt. Deze doel-id's worden
alleen behouden voor compatibiliteit; gebruik voor nieuwe configuraties de
huidige selecteerbare modellen.

| Bronmodel     | Doel voor snelle modus |
| ------------- | ---------------------- |
| `grok-3`      | `grok-3-fast`          |
| `grok-3-mini` | `grok-3-mini-fast`     |
| `grok-4`      | `grok-4-fast`          |
| `grok-4-0709` | `grok-4-fast`          |

### Verouderde compatibiliteit en veranderende aliassen

Oudere aliassen worden als volgt genormaliseerd:

| Verouderde alias                                               | Genormaliseerde id |
| -------------------------------------------------------------- | ------------------ |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`  | `grok-build-0.1`   |

De gedateerde 0309-id's zijn de selecteerbare catalogusvermeldingen. OpenClaw
stuurt alle andere huidige Grok 4.20-aliassen ongewijzigd door, zodat xAI de
semantiek van stabiele, nieuwste, bèta-, experimentele en gedateerde aliassen
blijft beheren. De algemene alias `grok-latest` wordt eveneens ongewijzigd
behouden.

xAI heeft de volgende exacte id's buiten gebruik gesteld. OpenClaw behoudt ze
als verborgen compatibiliteitsregels voor uitgebrachte configuraties, met de
beperkingen en prijzen van hun huidige omleidingsdoelen:

| Buiten gebruik gestelde id's                                        | Huidig gedrag                         |
| ------------------------------------------------------------------- | ------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`   | Grok 4.3 met `low` redenering         |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3`| Grok 4.3 met redenering uitgeschakeld |
| `grok-code-fast-1`                                                  | Grok Build 0.1                        |
| `grok-imagine-image-pro`                                            | Grok Imagine Image Quality            |

`openclaw doctor --fix` werkt opgeslagen standaardwaarden voor xAI-servertools
en de buiten gebruik gestelde slug voor kwaliteitsafbeeldingen bij, verwijdert
verouderde gegenereerde catalogusregels en herstelt verouderde contextmetadata
van actieve 4.20-regels. Het zet actieve 4.20-aliassen met `beta-latest` niet
vast op een gedateerde momentopname.

## Functies

<Warning>
  `x_search` en `code_execution` worden uitgevoerd op de servers van xAI. xAI
  brengt $5 per 1.000 toolaanroepen in rekening, plus de invoer- en
  uitvoertokens van het model. Wanneer de instelling `enabled` van een tool is
  weggelaten, stelt OpenClaw deze alleen beschikbaar voor een actief xAI-model.
  Een bekende modelprovider die niet van xAI is, vereist expliciet
  `enabled: true` per tool; bij een ontbrekende of niet-opgeloste provider wordt
  de toegang standaard geweigerd. xAI-authenticatie is altijd vereist en
  `enabled: false` schakelt de tool voor elke provider uit.
</Warning>

<AccordionGroup>
  <Accordion title="Zoeken op het web">
    De gebundelde webzoekprovider `grok` geeft de voorkeur aan xAI OAuth en valt
    vervolgens terug op `XAI_API_KEY` of een webzoeksleutel van de plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video's genereren">
    De gebundelde `xai`-plugin registreert videogeneratie via de gedeelde tool
    `video_generate`.

    - Standaardmodel: `xai/grok-imagine-video`
    - Aanvullend model: `xai/grok-imagine-video-1.5`
    - Klassieke modi: tekst-naar-video, afbeelding-naar-video, genereren met
      referentieafbeeldingen, externe videobewerking en externe videoverlenging
    - Video 1.5-modus: alleen afbeelding-naar-video, met precies één afbeelding
      als eerste frame
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      klassieke en Video 1.5-afbeelding-naar-video nemen bij weglating de
      beeldverhouding van de bronafbeelding over
    - Resoluties: klassiek `480P`/`720P`; Video 1.5 ondersteunt ook `1080P`;
      alle generatiemodi gebruiken standaard `480P`
    - Duur: 1-15 seconden voor generatie/afbeelding-naar-video, 1-10 seconden
      bij gebruik van klassieke `reference_image`-rollen, 2-10 seconden voor
      klassieke verlenging
    - Genereren met referentieafbeeldingen: stel `imageRoles` voor elke
      aangeleverde afbeelding in op `reference_image`; xAI accepteert maximaal
      7 van zulke afbeeldingen
    - Videobewerking/-verlenging neemt de beeldverhouding en resolutie van de
      invoervideo over; deze bewerkingen accepteren geen geometrie-overschrijvingen
    - Standaardtime-out voor bewerkingen: 600 seconden, tenzij
      `video_generate.timeoutMs` of
      `agents.defaults.videoGenerationModel.timeoutMs` is ingesteld

    <Warning>
    Lokale videobuffers worden niet geaccepteerd. Gebruik externe `http(s)`-URL's
    voor invoer voor videobewerking/-verlenging. Afbeelding-naar-video accepteert
    lokale afbeeldingsbuffers, omdat OpenClaw deze voor xAI als data-URL's
    codeert.
    </Warning>

    Video 1.5 herkent ook de xAI-id's `grok-imagine-video-1.5-preview` en
    `grok-imagine-video-1.5-2026-05-30`. OpenClaw stuurt de geselecteerde id
    ongewijzigd door, maar past dezelfde validatie voor uitsluitend
    afbeeldingen toe.

    xAI als standaardvideoprovider gebruiken:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters,
    providerselectie en terugvalgedrag.
    </Note>

  </Accordion>

  <Accordion title="Afbeeldingen genereren">
    De gebundelde `xai`-plugin registreert afbeeldingsgeneratie via de gedeelde
    tool `image_generate`.

    - Standaard afbeeldingsmodel: `xai/grok-imagine-image`
    - Aanvullend model: `xai/grok-imagine-image-quality`
    - Modi: tekst-naar-afbeelding en bewerking van een referentieafbeelding
    - Referentie-invoer: één `image` of maximaal drie `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluties: `1K`, `2K`
    - Aantal: maximaal 4 afbeeldingen
    - Standaardtime-out voor bewerkingen: 600 seconden, tenzij `image_generate.timeoutMs`
      of `agents.defaults.imageGenerationModel.timeoutMs` is ingesteld

    OpenClaw vraagt xAI om afbeeldingsreacties als `b64_json`, zodat gegenereerde media
    via het normale pad voor kanaalbijlagen kunnen worden opgeslagen en afgeleverd. Lokale
    referentieafbeeldingen worden omgezet in data-URL's; externe `http(s)`-referenties
    worden ongewijzigd doorgegeven.

    xAI als standaardprovider voor afbeeldingen gebruiken:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI documenteert ook `quality`, `mask`, `user` en een beeldverhouding `auto`.
    OpenClaw geeft momenteel alleen de gedeelde provideroverschrijdende besturingselementen voor afbeeldingen door;
    deze uitsluitend systeemeigen opties zijn niet beschikbaar via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    De meegeleverde `xai`-plugin registreert tekst-naar-spraak via het gedeelde
    `tts`-provideroppervlak.

    - Stemmen: geauthenticeerde livecatalogus van xAI; geef deze weer met
      `openclaw infer tts voices --provider xai`
    - Offline terugvalstemmen: `ara`, `eve`, `leo`, `rex`, `sal`
    - Standaardstem: `eve`
    - Aangepaste stem-ID's van het account worden doorgegeven, zelfs wanneer ze ontbreken in
      het antwoord van de ingebouwde catalogus
    - Indelingen: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Taal: BCP-47-code of `auto`
    - Snelheid: systeemeigen snelheidsoverschrijving van de provider
    - De systeemeigen Opus-indeling voor spraakberichten wordt niet ondersteund

    xAI als standaard-TTS-provider gebruiken:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw gebruikt het batch-eindpunt `/v1/tts` van xAI en de geauthenticeerde
    catalogus `/v1/tts/voices`. xAI biedt ook streaming-TTS via WebSocket, maar
    de meegeleverde xAI-provider implementeert die streaminghaak nog niet.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    De meegeleverde `xai`-plugin registreert batchgewijze spraak-naar-tekst via het
    transcriptieoppervlak voor mediabegrip van OpenClaw.

    - Eindpunt: xAI REST `/v1/stt`
    - Invoerpad: upload van een audiobestand als multipart
    - Modelselectie: xAI kiest het transcriptiemodel intern; het
      eindpunt heeft geen modelkiezer
    - Wordt overal gebruikt waar transcriptie van inkomende audio `tools.media.audio` leest,
      waaronder segmenten uit Discord-spraakkanalen en audiobijlagen van kanalen

    xAI afdwingen voor transcriptie van inkomende audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    De taal kan worden opgegeven via de gedeelde configuratie voor audiomedia of per
    transcriptieaanvraag. Promptaanwijzingen worden geaccepteerd door het gedeelde OpenClaw-
    oppervlak, maar de xAI REST STT-integratie geeft alleen het bestand en de taal door,
    omdat die overeenkomen met het huidige openbare xAI-eindpunt.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    De meegeleverde `xai`-plugin registreert ook een provider voor realtime transcriptie
    van audio uit live spraakoproepen.

    - Eindpunt: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standaardcodering: `mulaw`
    - Standaardbemonsteringsfrequentie: `8000`
    - Standaardeindpuntdetectie: `800ms`
    - Tussentijdse transcripties: standaard ingeschakeld

    De Twilio-mediastream van Voice Call verzendt G.711-mu-law-audioframes, zodat de
    xAI-provider deze frames rechtstreeks doorgeeft zonder transcodering:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Configuratie die eigendom is van de provider staat onder
    `plugins.entries.voice-call.config.streaming.providers.xai`. Ondersteunde
    sleutels zijn `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` of
    `alaw`), `interimResults`, `endpointingMs` en `language`.

    <Note>
    Deze streamingprovider is bedoeld voor het realtime transcriptiepad van Voice Call.
    Discord neemt korte segmenten op en gebruikt in plaats daarvan het batchgewijze
    transcriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    De meegeleverde xAI-plugin biedt `x_search` aan als OpenClaw-hulpmiddel voor
    het doorzoeken van inhoud op X (voorheen Twitter) via Grok.

    Configuratiepad: `plugins.entries.xai.config.xSearch`

    | Sleutel           | Type    | Standaard                 | Beschrijving                                                |
    | ----------------- | ------- | ------------------------- | ----------------------------------------------------------- |
    | `enabled`         | boolean | Automatisch voor xAI-modellen | Uitschakelen of inschakelen voor een bekende niet-xAI-provider |
    | `model`           | string  | `grok-4.3`                | Model dat voor x_search-aanvragen wordt gebruikt            |
    | `baseUrl`         | string  | -                         | Overschrijving van de basis-URL voor xAI Responses          |
    | `inlineCitations` | boolean | -                         | Inline bronvermeldingen in resultaten opnemen               |
    | `maxTurns`        | number  | -                         | Maximaal aantal gespreksbeurten                              |
    | `timeoutSeconds`  | number  | `30`                      | Time-out van aanvragen in seconden                           |
    | `cacheTtlMinutes` | number  | `15`                      | Levensduur van de cache in minuten                           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution configuration">
    De meegeleverde xAI-plugin biedt `code_execution` aan als OpenClaw-hulpmiddel voor
    externe code-uitvoering in de sandboxomgeving van xAI.

    Configuratiepad: `plugins.entries.xai.config.codeExecution`

    | Sleutel          | Type    | Standaard                 | Beschrijving                                                |
    | ---------------- | ------- | ------------------------- | ----------------------------------------------------------- |
    | `enabled`        | boolean | Automatisch voor xAI-modellen | Uitschakelen of inschakelen voor een bekende niet-xAI-provider |
    | `model`          | string  | `grok-4.3`                | Model dat voor code-uitvoeringsaanvragen wordt gebruikt     |
    | `maxTurns`       | number  | -                         | Maximaal aantal gespreksbeurten                              |
    | `timeoutSeconds` | number  | `30`                      | Time-out van aanvragen in seconden                           |

    <Note>
    Dit is externe uitvoering in de xAI-sandbox, niet lokale [`exec`](/nl/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Known limits">
    - xAI-authenticatie kan een API-sleutel, omgevingsvariabele, terugvalconfiguratie
      van de plugin of OAuth met een geschikt xAI-account gebruiken. OAuth gebruikt
      verificatie met een apparaatcode zonder localhost-callback. xAI bepaalt welke
      accounts OAuth-API-tokens kunnen ontvangen en de toestemmingspagina kan Grok Build
      tonen, hoewel OpenClaw de Grok Build-app niet vereist.
    - OpenClaw biedt de xAI-modelfamilie met meerdere agents momenteel niet aan. xAI
      levert deze modellen via de Responses API, maar ze accepteren niet de
      client-side of aangepaste hulpmiddelen die door de gedeelde agentlus van OpenClaw worden gebruikt.
      Zie de
      [beperkingen van xAI voor meerdere agents](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime-spraak is nog niet als OpenClaw-provider geregistreerd. Hiervoor
      is een ander contract voor bidirectionele spraaksessies nodig dan voor batch-STT
      of streamingtranscriptie.
    - `quality` voor xAI-afbeeldingen, afbeeldingsmaskers via `mask` en de systeemeigen
      beeldverhouding `auto` worden pas aangeboden wanneer het gedeelde hulpmiddel
      `image_generate` overeenkomstige provideroverschrijdende besturingselementen heeft.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw past xAI-specifieke compatibiliteitsoplossingen voor hulpmiddelschema's
      en hulpmiddelaanroepen automatisch toe op het gedeelde uitvoeringspad.
    - Systeemeigen xAI-aanvragen gebruiken standaard `tool_stream: true`. Stel
      `agents.defaults.models["xai/<model>"].params.tool_stream` in op `false`
      om dit uit te schakelen.
    - De meegeleverde xAI-wrapper verwijdert niet-ondersteunde schemagrenzen voor
      aantallen in contains en niet-ondersteunde payloadsleutels voor redeneer-*inspanning*
      voordat systeemeigen xAI-aanvragen worden verzonden. Grok 4.5 ondersteunt lage,
      gemiddelde en hoge inspanning (standaard hoog). Grok 4.3 ondersteunt geen,
      lage, gemiddelde en hoge inspanning (standaard laag). Andere xAI-modellen die
      kunnen redeneren bieden geen configureerbare regeling voor inspanning, maar vragen
      nog steeds `include: ["reasoning.encrypted_content"]` aan, zodat eerdere versleutelde
      redeneringen bij vervolgronden opnieuw kunnen worden afgespeeld.
    - `web_search`, `x_search` en `code_execution` worden aangeboden als OpenClaw-
      hulpmiddelen. OpenClaw koppelt alleen de specifieke ingebouwde xAI-functie die elk
      hulpmiddel nodig heeft aan de aanvraag van dat hulpmiddel, in plaats van elk
      systeemeigen hulpmiddel aan elke chatbeurt te koppelen.
    - Grok `web_search` leest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` leest `plugins.entries.xai.config.xSearch.baseUrl` en
      valt vervolgens terug op de basis-URL voor zoeken op het web van Grok.
    - `x_search` en `code_execution` zijn eigendom van de meegeleverde xAI-plugin
      en zijn niet hardgecodeerd in de kernruntime voor modellen.
    - `code_execution` is externe uitvoering in de xAI-sandbox, niet lokale
      [`exec`](/nl/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testen

De xAI-mediapaden worden gedekt door unittests en optionele live-testsuites. Exporteer
`XAI_API_KEY` in de procesomgeving voordat u livecontroles uitvoert.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Het providerspecifieke livebestand synthetiseert normale TTS, telefonievriendelijke PCM-
TTS, transcribeert audio via xAI-batch-STT, streamt dezelfde PCM via xAI-
realtime-STT, genereert tekst-naar-beeld-uitvoer en bewerkt een referentieafbeelding.
Het gedeelde livebestand voor afbeeldingen verifieert dezelfde xAI-provider via OpenClaws
runtimeselectie, fallback, normalisatie en pad voor mediabijlagen. De
optionele Video 1.5-test verzendt één gegenereerde afbeelding voor het eerste frame in 1080P en
verifieert het downloaden van de voltooide video.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor de videotool en providerselectie.
  </Card>
  <Card title="Alle providers" href="/nl/providers/index" icon="grid-2">
    Het bredere provideroverzicht.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en oplossingen.
  </Card>
</CardGroup>
