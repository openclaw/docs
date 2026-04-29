---
read_when:
    - Je wilt Grok-modellen gebruiken in OpenClaw
    - Je configureert xAI-authenticatie of model-ID's
summary: xAI Grok-modellen gebruiken in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-29T23:14:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw wordt geleverd met een gebundelde `xai`-providerplugin voor Grok-modellen.

## Aan de slag

<Steps>
  <Step title="Create an API key">
    Maak een API-sleutel aan in de [xAI-console](https://console.x.ai/).
  </Step>
  <Step title="Set your API key">
    Stel `XAI_API_KEY` in, of voer uit:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Pick a model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw gebruikt de xAI Responses API als het gebundelde xAI-transport. Dezelfde
`XAI_API_KEY` kan ook Grok-ondersteunde `web_search`, eersteklas `x_search`,
en externe `code_execution` aandrijven.
Als je een xAI-sleutel opslaat onder `plugins.entries.xai.config.webSearch.apiKey`,
hergebruikt de gebundelde xAI-modelprovider die sleutel ook als fallback.
Afstemming van `code_execution` staat onder `plugins.entries.xai.config.codeExecution`.
</Note>

## Ingebouwde catalogus

OpenClaw bevat standaard deze xAI-modelfamilies:

| Familie       | Model-id's                                                               |
| ------------- | ------------------------------------------------------------------------ |
| Grok 3        | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4        | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast   | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code     | `grok-code-fast-1`                                                       |

De plugin lost ook nieuwere `grok-4*`- en `grok-code-fast*`-id's vooruit op wanneer
ze dezelfde API-vorm volgen.

<Tip>
`grok-4-fast`, `grok-4-1-fast` en de `grok-4.20-beta-*`-varianten zijn de
huidige afbeeldingsgeschikte Grok-referenties in de gebundelde catalogus.
</Tip>

## OpenClaw-functiedekking

De gebundelde plugin koppelt het huidige openbare API-oppervlak van xAI aan de gedeelde
provider- en toolcontracten van OpenClaw. Mogelijkheden die niet in het gedeelde contract passen
(bijvoorbeeld streaming TTS en realtime spraak) worden niet beschikbaar gemaakt — zie de tabel
hieronder.

| xAI-mogelijkheid          | OpenClaw-oppervlak                       | Status                                                              |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses          | `xai/<model>`-modelprovider              | Ja                                                                  |
| Server-side webzoekactie  | `web_search`-provider `grok`             | Ja                                                                  |
| Server-side X-zoekactie   | `x_search`-tool                          | Ja                                                                  |
| Server-side code-uitvoering | `code_execution`-tool                  | Ja                                                                  |
| Afbeeldingen              | `image_generate`                         | Ja                                                                  |
| Video's                   | `video_generate`                         | Ja                                                                  |
| Batch tekst-naar-spraak   | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                  |
| Streaming TTS             | —                                        | Niet beschikbaar gemaakt; het TTS-contract van OpenClaw retourneert volledige audiobuffers |
| Batch spraak-naar-tekst   | `tools.media.audio` / mediabegrip        | Ja                                                                  |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "xai"` | Ja                                                                  |
| Realtime spraak           | —                                        | Nog niet beschikbaar gemaakt; ander sessie-/WebSocket-contract      |
| Bestanden / batches       | Alleen generieke model-API-compatibiliteit | Geen eersteklas OpenClaw-tool                                      |

<Note>
OpenClaw gebruikt xAI's REST-API's voor afbeeldingen/video/TTS/STT voor mediageneratie,
spraak en batchtranscriptie, xAI's streaming STT-WebSocket voor live
transcriptie van spraakoproepen, en de Responses API voor model-, zoek- en
code-uitvoeringstools. Functies die andere OpenClaw-contracten nodig hebben, zoals
Realtime-spraaksessies, worden hier gedocumenteerd als upstream-mogelijkheden in plaats van
verborgen plugingedrag.
</Note>

### Fast-mode-toewijzingen

`/fast on` of `agents.defaults.models["xai/<model>"].params.fastMode: true`
herschrijft native xAI-verzoeken als volgt:

| Bronmodel     | Fast-mode-doel     |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Legacy-compatibiliteitsaliassen

Legacy-aliassen worden nog steeds genormaliseerd naar de canonieke gebundelde id's:

| Legacy-alias              | Canonieke id                         |
| ------------------------- | ------------------------------------ |
| `grok-4-fast-reasoning`   | `grok-4-fast`                        |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                      |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`    |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Functies

<AccordionGroup>
  <Accordion title="Web search">
    De gebundelde `grok`-provider voor webzoekacties gebruikt ook `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    De gebundelde `xai`-plugin registreert videogeneratie via de gedeelde
    `video_generate`-tool.

    - Standaardvideomodel: `xai/grok-imagine-video`
    - Modi: tekst-naar-video, afbeelding-naar-video, referentieafbeeldingsgeneratie, externe
      videobewerking en externe video-uitbreiding
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluties: `480P`, `720P`
    - Duur: 1-15 seconden voor generatie/afbeelding-naar-video, 1-10 seconden bij
      gebruik van `reference_image`-rollen, 2-10 seconden voor uitbreiding
    - Referentieafbeeldingsgeneratie: stel `imageRoles` in op `reference_image` voor
      elke aangeleverde afbeelding; xAI accepteert maximaal 7 van zulke afbeeldingen

    <Warning>
    Lokale videobuffers worden niet geaccepteerd. Gebruik externe `http(s)`-URL's voor
    invoer voor videobewerking/-uitbreiding. Afbeelding-naar-video accepteert lokale afbeeldingsbuffers omdat
    OpenClaw die als data-URL's voor xAI kan coderen.
    </Warning>

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
    providerselectie en failovergedrag.
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    De gebundelde `xai`-plugin registreert afbeeldingsgeneratie via de gedeelde
    `image_generate`-tool.

    - Standaardafbeeldingsmodel: `xai/grok-imagine-image`
    - Aanvullend model: `xai/grok-imagine-image-pro`
    - Modi: tekst-naar-afbeelding en bewerking met referentieafbeelding
    - Referentie-invoer: één `image` of maximaal vijf `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluties: `1K`, `2K`
    - Aantal: maximaal 4 afbeeldingen

    OpenClaw vraagt xAI om `b64_json`-afbeeldingsresponses zodat gegenereerde media kunnen worden
    opgeslagen en geleverd via het normale pad voor kanaalbijlagen. Lokale
    referentieafbeeldingen worden geconverteerd naar data-URL's; externe `http(s)`-referenties worden
    doorgestuurd.

    Om xAI als standaardafbeeldingsprovider te gebruiken:

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
    xAI documenteert ook `quality`, `mask`, `user` en aanvullende native verhoudingen
    zoals `1:2`, `2:1`, `9:20` en `20:9`. OpenClaw stuurt vandaag alleen de
    gedeelde cross-provider afbeeldingsinstellingen door; niet-ondersteunde native-only knoppen
    worden bewust niet via `image_generate` beschikbaar gemaakt.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    De gebundelde `xai`-plugin registreert tekst-naar-spraak via het gedeelde `tts`-
    provideroppervlak.

    - Stemmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standaardstem: `eve`
    - Formaten: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Taal: BCP-47-code of `auto`
    - Snelheid: provider-native snelheidsoverschrijving
    - Native Opus-indeling voor spraaknotities wordt niet ondersteund

    Om xAI als standaard-TTS-provider te gebruiken:

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
    OpenClaw gebruikt xAI's batch-`/v1/tts`-endpoint. xAI biedt ook streaming TTS
    via WebSocket, maar het spraakprovidercontract van OpenClaw verwacht momenteel
    een volledige audiobuffer voordat een antwoord wordt geleverd.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    De gebundelde `xai`-plugin registreert batch spraak-naar-tekst via OpenClaw's
    transcriptieoppervlak voor mediabegrip.

    - Standaardmodel: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Invoerpad: multipart-upload van audiobestand
    - Ondersteund door OpenClaw overal waar transcriptie van inkomende audio
      `tools.media.audio` gebruikt, waaronder Discord-spraakkanaalsegmenten en
      audiobijlagen in kanalen

    Om xAI af te dwingen voor transcriptie van inkomende audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Taal kan worden opgegeven via de gedeelde audiomediaconfiguratie of per aanroep
    in het transcriptieverzoek. Prompt-hints worden geaccepteerd door het gedeelde OpenClaw-
    oppervlak, maar de xAI REST STT-integratie stuurt alleen bestand, model en
    taal door, omdat die netjes overeenkomen met het huidige openbare xAI-endpoint.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    De gebundelde `xai`-plugin registreert ook een realtime transcriptieprovider
    voor live spraakoproepaudio.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standaardcodering: `mulaw`
    - Standaardsamplefrequentie: `8000`
    - Standaard endpointing: `800ms`
    - Tussentijdse transcripties: standaard ingeschakeld

    De Twilio-mediastream van Voice Call verzendt G.711 µ-law-audioframes, zodat de
    xAI-provider die frames direct kan doorsturen zonder transcodering:

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

    Provider-eigen configuratie staat onder
    `plugins.entries.voice-call.config.streaming.providers.xai`. Ondersteunde
    sleutels zijn `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` of
    `alaw`), `interimResults`, `endpointingMs` en `language`.

    <Note>
    Deze streamingprovider is bedoeld voor het realtime transcriptiepad van Voice Call.
    Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batchtranscriptiepad
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search-configuratie">
    De meegeleverde xAI-Plugin stelt `x_search` beschikbaar als OpenClaw-tool voor het doorzoeken
    van X-content (voorheen Twitter) via Grok.

    Configuratiepad: `plugins.entries.xai.config.xSearch`

    | Sleutel            | Type    | Standaard          | Beschrijving                         |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_search in- of uitschakelen         |
    | `model`            | string  | `grok-4-1-fast`    | Model gebruikt voor x_search-aanvragen |
    | `inlineCitations`  | boolean | —                  | Inline citaties opnemen in resultaten |
    | `maxTurns`         | number  | —                  | Maximumaantal gespreksbeurten        |
    | `timeoutSeconds`   | number  | —                  | Aanvraagtime-out in seconden         |
    | `cacheTtlMinutes`  | number  | —                  | Cache time-to-live in minuten        |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    De meegeleverde xAI-Plugin stelt `code_execution` beschikbaar als OpenClaw-tool voor
    code-uitvoering op afstand in de sandboxomgeving van xAI.

    Configuratiepad: `plugins.entries.xai.config.codeExecution`

    | Sleutel           | Type    | Standaard          | Beschrijving                            |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (als sleutel beschikbaar is) | Code-uitvoering in- of uitschakelen |
    | `model`           | string  | `grok-4-1-fast`    | Model gebruikt voor code-uitvoeringsaanvragen |
    | `maxTurns`        | number  | —                  | Maximumaantal gespreksbeurten            |
    | `timeoutSeconds`  | number  | —                  | Aanvraagtime-out in seconden             |

    <Note>
    Dit is externe uitvoering in een xAI-sandbox, geen lokale [`exec`](/nl/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bekende beperkingen">
    - Auth werkt momenteel alleen met API-sleutels. Er is nog geen xAI OAuth- of apparaatcodeflow in
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` wordt niet ondersteund op het
      normale xAI-providerpad, omdat dit een ander upstream API-oppervlak vereist
      dan het standaard OpenClaw xAI-transport.
    - xAI Realtime-spraak is nog niet geregistreerd als OpenClaw-provider. Dit
      vereist een ander bidirectioneel spraaksessiecontract dan batch-STT of
      streamingtranscriptie.
    - xAI-afbeeldings`quality`, afbeeldings`mask` en extra native-only beeldverhoudingen worden
      pas beschikbaar gesteld wanneer de gedeelde tool `image_generate` bijbehorende
      provideroverschrijdende besturingselementen heeft.
  </Accordion>

  <Accordion title="Geavanceerde opmerkingen">
    - OpenClaw past automatisch xAI-specifieke compatibiliteitsoplossingen voor tool-schema's en tool-calls toe
      op het gedeelde runnerpad.
    - Native xAI-aanvragen gebruiken standaard `tool_stream: true`. Stel
      `agents.defaults.models["xai/<model>"].params.tool_stream` in op `false` om
      dit uit te schakelen.
    - De meegeleverde xAI-wrapper verwijdert niet-ondersteunde strikte tool-schema-vlaggen en
      reasoning-payloadsleutels voordat native xAI-aanvragen worden verzonden.
    - `web_search`, `x_search` en `code_execution` worden beschikbaar gesteld als OpenClaw-
      tools. OpenClaw schakelt de specifieke ingebouwde xAI-tool in die het nodig heeft binnen elke tool-
      aanvraag, in plaats van alle native tools aan elke chatbeurt toe te voegen.
    - `x_search` en `code_execution` zijn eigendom van de meegeleverde xAI-Plugin en
      zijn niet hardcoded in de core-modelruntime.
    - `code_execution` is externe uitvoering in een xAI-sandbox, geen lokale
      [`exec`](/nl/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testen

De xAI-mediapaden worden gedekt door unittests en opt-in livesuites. De live
commando's laden geheimen uit je login-shell, inclusief `~/.profile`, voordat
`XAI_API_KEY` wordt getest.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Het provider-specifieke livebestand synthetiseert normale TTS, telefoonvriendelijke PCM-
TTS, transcribeert audio via xAI batch-STT, streamt dezelfde PCM via xAI
realtime STT, genereert tekst-naar-afbeelding-uitvoer en bewerkt een referentieafbeelding. Het
gedeelde livebestand voor afbeeldingen verifieert dezelfde xAI-provider via OpenClaw's
runtime-selectie, fallback, normalisatie en pad voor mediabijlagen.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde videotoolparameters en providerselectie.
  </Card>
  <Card title="Alle providers" href="/nl/providers/index" icon="grid-2">
    Het bredere provideroverzicht.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en oplossingen.
  </Card>
</CardGroup>
