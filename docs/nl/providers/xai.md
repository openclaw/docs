---
read_when:
    - Je wilt Grok-modellen gebruiken in OpenClaw
    - Je configureert xAI-authenticatie of model-id's
summary: Gebruik xAI Grok-modellen in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T16:22:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw wordt geleverd met een gebundelde `xai`-providerplugin voor Grok-modellen. Het
aanbevolen pad is Grok OAuth met een geschikt SuperGrok- of X Premium-
abonnement. Gateway, configuratie, routering en tools blijven lokaal; alleen Grok-
verzoeken gaan naar de API van xAI.

OAuth vereist geen xAI API-sleutel of de Grok Build-app. xAI kan nog steeds
Grok Build op het toestemmingsscherm tonen, omdat OpenClaw de gedeelde
OAuth-client van xAI gebruikt.

## Installatie

<Steps>
  <Step title="Nieuwe installatie">
    Voer de onboarding uit met installatie van de daemon en kies vervolgens xAI/Grok OAuth bij de
    stap voor model/authenticatie:

    ```bash
    openclaw onboard --install-daemon
    ```

    Selecteer op een VPS of via SSH rechtstreeks xAI OAuth; dit gebruikt verificatie
    met een apparaatcode en heeft geen localhost-callback nodig:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="Bestaande installatie">
    Meld je alleen aan bij xAI; voer niet de volledige onboarding opnieuw uit alleen om Grok te verbinden:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Stel Grok afzonderlijk in als standaardmodel:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Voer de volledige onboarding alleen opnieuw uit als je bewust de Gateway,
    daemon, het kanaal, de werkruimte of andere installatiekeuzes wilt wijzigen.

  </Step>
  <Step title="Pad met API-sleutel">
    Installatie met een API-sleutel werkt nog steeds voor sleutels uit xAI Console en voor media-oppervlakken
    waarvoor providerconfiguratie op basis van een sleutel nodig is:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="Kies een model">
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
`code_execution`, spraak/transcriptie en het genereren van afbeeldingen/video's door xAI. Als je
een xAI-sleutel opslaat onder `plugins.entries.xai.config.webSearch.apiKey`, gebruikt de
gebundelde xAI-modelprovider deze ook opnieuw als terugvaloptie.
</Note>

## Problemen met OAuth oplossen

- Gebruik voor SSH, Docker, VPS of andere externe installaties
  `openclaw models auth login --provider xai --method oauth`; dit gebruikt
  verificatie met een apparaatcode, geen localhost-callback.
- Als de aanmelding slaagt maar Grok niet het standaardmodel is, voer je
  `openclaw models set xai/grok-4.3` uit.
- Bekijk opgeslagen xAI-authenticatieprofielen:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI bepaalt welke accounts OAuth API-tokens kunnen ontvangen. Als een account
  niet in aanmerking komt, gebruik je het pad met de API-sleutel of controleer je het abonnement bij xAI.

<Tip>
Gebruik `xai-oauth` wanneer je je aanmeldt via SSH, Docker of een VPS. OpenClaw toont een
URL en korte code; voltooi de aanmelding in een willekeurige lokale browser terwijl het externe
proces xAI bevraagt voor de voltooide tokenuitwisseling.
</Tip>

## Ingebouwde catalogus

Selecteerbare id's in modelkiezers. De plugin herkent nog steeds oudere id's van Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast en Grok Code voor bestaande configuraties;
zie [compatibiliteit met oudere versies en veranderende aliassen](#legacy-compatibility-and-moving-aliases).

| Familie        | Model-id's                                                   |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (aliassen: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (aliassen: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
Gebruik `grok-4.5` voor algemene chats, programmeren en agentisch werk waar dit beschikbaar is.
Grok 4.3 blijft de regioveilige standaard voor installatie; `grok-build-0.1` en beide
gedateerde Grok 4.20-varianten blijven selecteerbaar.
</Tip>

## Functieondersteuning

De gebundelde plugin koppelt ondersteunde xAI-API's aan de gedeelde provider- en
toolcontracten van OpenClaw. Mogelijkheden die niet binnen het gedeelde contract passen, worden
hieronder of onder bekende beperkingen vermeld.

| xAI-mogelijkheid            | OpenClaw-oppervlak                      | Status                                               |
| --------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Chat / Responses            | `xai/<model>`-modelprovider            | Ja                                                   |
| Webzoeken aan serverzijde   | `web_search`-provider `grok`            | Ja                                                   |
| Zoeken op X aan serverzijde | `x_search`-tool                         | Ja                                                   |
| Code-uitvoering aan serverzijde | `code_execution`-tool                   | Ja                                                   |
| Afbeeldingen                | `image_generate`                        | Ja                                                   |
| Video's                     | `video_generate`                        | Ja                                                   |
| Batchgewijze tekst-naar-spraak | `messages.tts.provider: "xai"` / `tts`  | Ja                                                   |
| Streaming-TTS               | `textToSpeechStream`                    | Ja, via `wss://api.x.ai/v1/tts` (geen realtime spraak) |
| Batchgewijze spraak-naar-tekst | `tools.media.audio`-mediabegrip | Ja                                                   |
| Streaming-spraak-naar-tekst | Voice Call `streaming.provider: "xai"`  | Ja                                                   |
| Realtime spraak             | Talk `talk.realtime.provider: "xai"`    | Ja; Gateway-relay voor native Talk-nodes             |
| Bestanden / batches         | Alleen compatibiliteit met generieke model-API | Geen volwaardige OpenClaw-tool                  |

<Note>
OpenClaw gebruikt de REST-API's van xAI voor afbeeldingen/video's/TTS/STT voor mediageneratie en
batchtranscriptie, de streaming-STT-WebSocket van xAI voor live transcriptie
van spraakoproepen, de Grok Voice Agent-WebSocket van xAI voor realtime Talk-sessies
en de Responses API voor chat-, zoek- en code-uitvoeringstools.
</Note>

### Compatibiliteit met oudere snelle modus

`/fast on` of `agents.defaults.models["xai/<model>"].params.fastMode: true`
herschrijft oudere xAI-configuraties nog steeds als volgt. Deze doel-id's worden
alleen voor compatibiliteit behouden; gebruik actuele selecteerbare modellen voor nieuwe
configuraties.

| Bronmodel     | Doel voor snelle modus |
| ------------- | ---------------------- |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Compatibiliteit met oudere versies en veranderende aliassen

Oudere aliassen worden als volgt genormaliseerd:

| Oudere alias                                                   | Genormaliseerde id |
| -------------------------------------------------------------- | ------------------ |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

De gedateerde 0309-id's zijn de selecteerbare catalogusvermeldingen. OpenClaw verzendt alle andere
actuele Grok 4.20-aliassen ongewijzigd, zodat xAI de controle behoudt over de semantiek van stabiele, nieuwste,
bèta-, experimentele en gedateerde aliassen. De algemene alias `grok-latest` blijft
eveneens ongewijzigd behouden.

xAI heeft de volgende exacte id's buiten gebruik gesteld. OpenClaw behoudt ze als verborgen compatibiliteits-
rijen voor uitgebrachte configuraties, met de beperkingen en prijzen van hun actuele
omleidingsdoelen:

| Buiten gebruik gestelde id's                                         | Actueel gedrag                   |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 met `low`-redenering    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 met redenering uitgeschakeld |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

`openclaw doctor --fix` werkt opgeslagen standaardwaarden voor xAI-servertools en de
buiten gebruik gestelde slug voor afbeeldingskwaliteit bij, verwijdert verouderde gegenereerde catalogusrijen en herstelt
verouderde contextmetadata in actieve 4.20-rijen. Actieve 4.20-
aliassen van `beta-latest` worden hiermee niet vastgezet op een gedateerde momentopname.

## Functies

<Warning>
  `x_search` en `code_execution` worden uitgevoerd op de servers van xAI. xAI brengt $5 per 1.000
  toolaanroepen in rekening, plus de invoer- en uitvoertokens van het model. Wanneer de instelling
  `enabled` van elke tool is weggelaten, stelt OpenClaw deze alleen beschikbaar voor een actief xAI-model.
  Een bekende niet-xAI-modelprovider vereist een expliciete `enabled: true` per tool;
  een ontbrekende of niet-opgeloste provider weigert standaard toegang. xAI-authenticatie is altijd vereist
  en `enabled: false` schakelt de tool voor elke provider uit.
</Warning>

<AccordionGroup>
  <Accordion title="Webzoeken">
    De gebundelde webzoekprovider `grok` geeft de voorkeur aan xAI OAuth en valt daarna terug
    op `XAI_API_KEY` of een webzoeksleutel van een plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogeneratie">
    De gebundelde plugin `xai` registreert videogeneratie via de gedeelde
    tool `video_generate`.

    - Standaardmodel: `xai/grok-imagine-video`
    - Aanvullend model: `xai/grok-imagine-video-1.5`
    - Klassieke modi: tekst-naar-video, afbeelding-naar-video, generatie met referentieafbeeldingen,
      externe videobewerking en externe videoverlenging
    - Video 1.5-modus: alleen afbeelding-naar-video, met exact één afbeelding voor het eerste frame
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      klassieke afbeelding-naar-video en die van Video 1.5 nemen de verhouding van de bronafbeelding over wanneer
      deze wordt weggelaten
    - Resoluties: klassiek `480P`/`720P`; Video 1.5 ondersteunt ook `1080P`; alle
      generatiemodi gebruiken standaard `480P`
    - Duur: 1-15 seconden voor generatie/afbeelding-naar-video, 1-10 seconden bij
      gebruik van klassieke `reference_image`-rollen, 2-10 seconden voor klassieke verlenging
    - Generatie met referentieafbeeldingen: stel `imageRoles` voor
      elke aangeleverde afbeelding in op `reference_image`; xAI accepteert maximaal 7 van zulke afbeeldingen
    - Videobewerking/-verlenging neemt de beeldverhouding en resolutie van de invoervideo over;
      deze bewerkingen accepteren geen geometrische overschrijvingen
    - Standaardtime-out voor bewerkingen: 600 seconden, tenzij `video_generate.timeoutMs`
      of `agents.defaults.videoGenerationModel.timeoutMs` is ingesteld

    <Warning>
    Lokale videobuffers worden niet geaccepteerd. Gebruik externe `http(s)`-URL's als invoer voor
    videobewerking/-verlenging. Afbeelding-naar-video accepteert lokale afbeeldingsbuffers, omdat
    OpenClaw deze voor xAI codeert als data-URL's.
    </Warning>

    Video 1.5 herkent ook de identifiers `grok-imagine-video-1.5-preview` en
    `grok-imagine-video-1.5-2026-05-30` van xAI. OpenClaw stuurt de
    geselecteerde identifier ongewijzigd door, maar past dezelfde validatie voor alleen afbeeldingen toe.

    Om xAI als standaardvideoprovider te gebruiken:

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

  <Accordion title="Afbeeldingsgeneratie">
    De gebundelde plugin `xai` registreert afbeeldingsgeneratie via de gedeelde
    tool `image_generate`.

    - Standaard afbeeldingsmodel: `xai/grok-imagine-image`
    - Aanvullend model: `xai/grok-imagine-image-quality`
    - Modi: tekst-naar-afbeelding en bewerking van referentieafbeeldingen
    - Referentie-invoer: één `image` of maximaal drie `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluties: `1K`, `2K`
    - Aantal: maximaal 4 afbeeldingen
    - Standaardtime-out voor bewerkingen: 600 seconden, tenzij `image_generate.timeoutMs`
      of `agents.defaults.imageGenerationModel.timeoutMs` is ingesteld

    OpenClaw vraagt xAI om `b64_json` afbeeldingsreacties, zodat gegenereerde media
    kunnen worden opgeslagen en afgeleverd via het normale pad voor kanaalbijlagen. Lokale
    referentieafbeeldingen worden geconverteerd naar data-URL's; externe `http(s)`-referenties
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
    xAI documenteert ook `quality`, `mask`, `user` en een beeldverhouding van `auto`.
    OpenClaw geeft momenteel alleen de gedeelde provideroverschrijdende afbeeldingsopties door;
    deze uitsluitend systeemeigen instellingen zijn niet beschikbaar via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Tekst-naar-spraak">
    De meegeleverde `xai`-plugin registreert tekst-naar-spraak via het gedeelde `tts`-provideroppervlak.

    - Stemmen: geverifieerde livecatalogus van xAI; geef deze weer met
      `openclaw infer tts voices --provider xai`
    - Offline reservestemmen: `ara`, `eve`, `leo`, `rex`, `sal`
    - Standaardstem: `eve`
    - Aangepaste stem-ID's van het account worden doorgegeven, zelfs wanneer ze ontbreken in het
      ingebouwde catalogusantwoord
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
    OpenClaw gebruikt xAI's batch-`/v1/tts`-eindpunt voor gebufferde synthese,
    geverifieerde ontdekking van de `/v1/tts/voices`-catalogus en systeemeigen
    `wss://api.x.ai/v1/tts` voor streamingsynthese. Streaming is beperkt tot
    de systeemeigen `api.x.ai`-host, waardoor aangepaste `baseUrl`-waarden voor dit
    pad worden geweigerd. Het gebruikt de bestaande instellingen voor taal, stem, codec en snelheid; de
    standaardwaarden van xAI zijn van toepassing op de samplefrequentie en bitsnelheid. Synthese naar audiobestanden respecteert alle
    geconfigureerde codecs. Voor doelen met spraakberichten wordt MP3 gebruikt voor streaming en gebufferde
    terugval, omdat de onbewerkte codecs van xAI geen metadata voor codec/frequentie bevatten. De
    stream verzendt `text.delta` en vervolgens
    `text.done`, ontvangt `audio.delta`, `audio.done` of `error` en past een
    inactieve `timeoutMs` toe die voor elk audiofragment wordt vernieuwd. Dit staat los van
    realtime spraaksessies. Zie het contract van xAI's [Streaming-TTS-API](https://docs.x.ai/developers/rest-api-reference/inference/voice).
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De meegeleverde `xai`-plugin registreert batchgewijze spraak-naar-tekst via OpenClaws
    transcriptieoppervlak voor mediabegrip.

    - Eindpunt: xAI REST `/v1/stt`
    - Invoerpad: multipart-upload van audiobestanden
    - Modelselectie: xAI kiest het transcriptiemodel intern; het
      eindpunt heeft geen modelselector
    - Wordt overal gebruikt waar transcriptie van binnenkomende audio `tools.media.audio` leest,
      waaronder segmenten van Discord-spraakkanalen en audiobijlagen van kanalen

    xAI afdwingen voor transcriptie van binnenkomende audio:

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
    oppervlak, maar de xAI REST-STT-integratie geeft alleen het bestand en de taal door,
    omdat die overeenkomen met het huidige openbare xAI-eindpunt.

  </Accordion>

  <Accordion title="Streaming-spraak-naar-tekst">
    De meegeleverde `xai`-plugin registreert ook een realtime transcriptieprovider
    voor audio van live spraakoproepen.

    - Eindpunt: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standaardcodering: `mulaw`
    - Standaardsamplefrequentie: `8000`
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

    Configuratie die eigendom is van de provider bevindt zich onder
    `plugins.entries.voice-call.config.streaming.providers.xai`. Ondersteunde
    sleutels zijn `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` of
    `alaw`), `interimResults`, `endpointingMs` en `language`.

    <Note>
    Deze streamingprovider is bestemd voor het realtime transcriptiepad van Voice Call.
    Discord neemt korte segmenten op en gebruikt in plaats daarvan het batchgewijze
    `tools.media.audio`-transcriptiepad.
    </Note>

  </Accordion>

  <Accordion title="Realtime spraak (Talk)">
    De meegeleverde `xai`-plugin registreert realtime Grok Voice Agent-sessies voor
    de Talk-modus via het gedeelde `registerRealtimeVoiceProvider`-contract.

    - Eindpunt: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - Standaardmodel: `grok-voice-latest`
    - Standaardstem: `eve`
    - Transport: `gateway-relay` (relaypaden voor iOS, Android en de Control UI)
    - Audio: PCM16 24 kHz of G.711 µ-law 8 kHz
    - Onderbreken: de server-VAD van xAI onderbreekt het antwoord; OpenClaw wist in de wachtrij geplaatste weergave
      en kapt niet-afgespeelde providergeschiedenis af

    Talk configureren op de Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // Schakel dit alleen in als het opnieuw afspelen van sessies aan de providerzijde acceptabel is.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Configuratie die eigendom is van de provider wordt ook opgehaald uit
    `plugins.entries.voice-call.config.realtime.providers.xai` wanneer Voice Call
    of gedeelde realtime selectors dezelfde providerkaart hergebruiken. Ondersteunde sleutels zijn
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` en `sessionResumption`.
    `reasoningEffort` accepteert alleen `high` of `none`, overeenkomstig de xAI Voice Agent-API.

    De server-VAD van xAI maakt altijd antwoorden en verwerkt audio-onderbrekingen.
    Gebruik `consultRouting: "provider-direct"`; gedwongen routering van transcripties en het uitschakelen van
    onderbreking van invoeraudio worden niet ondersteund door het xAI Voice Agent-protocol.

    <Note>
    xAI OAuth of `XAI_API_KEY` kan realtime spraak verifiëren. WebRTC dat door de browser wordt beheerd,
    maakt nog geen deel uit van dit provideroppervlak; gebruik Talk via gateway-relay op
    systeemeigen nodes of het relaypad van de Control UI.
    </Note>

    <Note>
    `sessionResumption` is standaard `false`. Wanneer dit is ingesteld op `true`, vraagt OpenClaw
    xAI om voldoende sessiestatus te behouden om hetzelfde gesprek na een
    nieuwe verbinding te hervatten en maakt vervolgens opnieuw verbinding met de geretourneerde gespreks-ID. Laat dit
    uitgeschakeld wanneer opnieuw afspelen/behouden aan de providerzijde niet acceptabel is; onderbroken
    sockets worden dan veilig afgesloten in plaats van stilzwijgend een nieuw gesprek te starten.
    </Note>

  </Accordion>

  <Accordion title="Configuratie van x_search">
    De meegeleverde xAI-plugin stelt `x_search` beschikbaar als een OpenClaw-tool voor
    het doorzoeken van inhoud op X (voorheen Twitter) via Grok.

    Configuratiepad: `plugins.entries.xai.config.xSearch`

    | Sleutel           | Type    | Standaard                 | Beschrijving                                     |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | Automatisch voor xAI-modellen | Uitschakelen of inschakelen voor een bekende niet-xAI-provider |
    | `model`           | string  | `grok-4.3`                | Model dat wordt gebruikt voor x_search-aanvragen |
    | `baseUrl`         | string  | -                         | Overschrijving van de basis-URL voor xAI Responses |
    | `inlineCitations` | boolean | -                         | Inline bronverwijzingen opnemen in resultaten    |
    | `maxTurns`        | number  | -                         | Maximaal aantal gespreksbeurten                   |
    | `timeoutSeconds`  | number  | `30`                      | Time-out van aanvragen in seconden                |
    | `cacheTtlMinutes` | number  | `15`                      | Cachelevensduur in minuten                        |

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

  <Accordion title="Configuratie voor code-uitvoering">
    De meegeleverde xAI-plugin stelt `code_execution` beschikbaar als een OpenClaw-tool voor
    externe code-uitvoering in de sandboxomgeving van xAI.

    Configuratiepad: `plugins.entries.xai.config.codeExecution`

    | Sleutel          | Type    | Standaard                | Beschrijving                                     |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | Automatisch voor xAI-modellen | Uitschakelen of inschakelen voor een bekende niet-xAI-provider |
    | `model`          | string  | `grok-4.3`               | Model dat wordt gebruikt voor code-uitvoeringsaanvragen |
    | `maxTurns`       | number  | -                        | Maximaal aantal gespreksbeurten                  |
    | `timeoutSeconds` | number  | `30`                     | Time-out van aanvragen in seconden               |

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

  <Accordion title="Bekende beperkingen">
    - xAI-authenticatie kan een API-sleutel, omgevingsvariabele, terugvaloptie
      voor Plugin-configuratie of OAuth met een geschikt xAI-account gebruiken. OAuth gebruikt
      verificatie via een apparaatcode zonder localhost-callback. xAI bepaalt welke accounts
      OAuth-API-tokens kunnen ontvangen en op de toestemmingspagina kan Grok Build worden
      weergegeven, hoewel OpenClaw de Grok Build-app niet vereist.
    - OpenClaw ontsluit momenteel niet de xAI-modelfamilie met meerdere agents. xAI
      biedt deze modellen aan via de Responses API, maar ze accepteren niet de
      client-side of aangepaste tools die de gedeelde agentlus van OpenClaw gebruikt.
      Zie de
      [beperkingen van xAI voor meerdere agents](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - Realtime-spraak van xAI ontsluit momenteel alleen Talk-transport via een Gateway-relay.
      WebSocket-sessies van providers die door de browser worden beheerd, zijn nog niet
      aangesloten in de Control UI.
    - xAI-afbeelding `quality`, afbeelding `mask` en aanvullende uitsluitend native beeldverhoudingen
      worden pas ontsloten wanneer de gedeelde tool `image_generate`
      overeenkomstige provideroverschrijdende bedieningselementen heeft.
  </Accordion>

  <Accordion title="Geavanceerde opmerkingen">
    - OpenClaw past xAI-specifieke compatibiliteitsoplossingen voor toolschema's en toolaanroepen
      automatisch toe in het gedeelde uitvoerpad.
    - Native xAI-verzoeken gebruiken standaard `tool_stream: true`. Stel
      `agents.defaults.models["xai/<model>"].params.tool_stream` in op `false`
      om dit uit te schakelen.
    - De meegeleverde xAI-wrapper verwijdert niet-ondersteunde schemabeperkingen voor aantallen van ‘contains’
      en niet-ondersteunde payloadsleutels voor redeneer-*inspanning* voordat native
      xAI-verzoeken worden verzonden. Grok 4.5 ondersteunt lage, gemiddelde en
      hoge inspanning (standaard hoog). Grok 4.3 ondersteunt geen, lage, gemiddelde en hoge
      inspanning (standaard laag). Andere xAI-modellen die kunnen redeneren, bieden geen
      instelbare regeling voor de inspanning, maar vragen nog steeds
      `include: ["reasoning.encrypted_content"]` aan zodat eerdere versleutelde redeneringen
      bij vervolgbeurten opnieuw kunnen worden afgespeeld.
    - `web_search`, `x_search` en `code_execution` worden ontsloten als OpenClaw-
      tools. OpenClaw koppelt alleen de specifieke ingebouwde xAI-functie die elke tool nodig heeft
      aan het verzoek van die tool, in plaats van elke native tool aan elke
      chatbeurt te koppelen.
    - Grok `web_search` leest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` leest `plugins.entries.xai.config.xSearch.baseUrl` en
      valt vervolgens terug op de basis-URL voor Grok-zoekopdrachten op het web.
    - `x_search` en `code_execution` worden beheerd door de meegeleverde xAI-Plugin
      in plaats van hardgecodeerd te zijn in de kernruntime voor modellen.
    - `code_execution` is uitvoering in een externe xAI-sandbox, niet lokale
      [`exec`](/nl/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testen

De xAI-mediapaden worden gedekt door unittests en optionele live-testsuites. Exporteer
`XAI_API_KEY` in de procesomgeving voordat je live-controles uitvoert.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Het providerspecifieke live-bestand genereert normale TTS, telefonievriendelijke PCM-
TTS, transcribeert audio via xAI-batch-STT, streamt dezelfde PCM via xAI-
realtime-STT, genereert tekst-naar-afbeeldingsuitvoer en bewerkt een referentieafbeelding.
Het gedeelde live-bestand voor afbeeldingen verifieert dezelfde xAI-provider via de
runtimeselectie, terugvalopties, normalisatie en het pad voor mediabijlagen van OpenClaw. De
optionele Video 1.5-test verzendt één gegenereerde afbeelding van het eerste frame in 1080P en
verifieert het downloaden van de voltooide video.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
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
