---
read_when:
    - Je wilt Grok-modellen gebruiken in OpenClaw
    - Je configureert xAI-authenticatie of model-ID's
summary: Gebruik xAI Grok-modellen in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T09:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw levert een gebundelde `xai` provider-plugin voor Grok-modellen.

## Aan de slag

<Steps>
  <Step title="Maak een API-sleutel">
    Maak een API-sleutel in de [xAI-console](https://console.x.ai/).
  </Step>
  <Step title="Stel je API-sleutel in">
    Stel `XAI_API_KEY` in, of voer uit:

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
OpenClaw gebruikt de xAI Responses-API als het gebundelde xAI-transport. Dezelfde
`XAI_API_KEY` kan ook Grok-ondersteunde `web_search`, eersteklas `x_search`
en externe `code_execution` aandrijven.
Als je een xAI-sleutel opslaat onder `plugins.entries.xai.config.webSearch.apiKey`,
gebruikt de gebundelde xAI-modelprovider die sleutel ook opnieuw als fallback.
Stel `plugins.entries.xai.config.webSearch.baseUrl` in om Grok `web_search`
en standaard `x_search` via een operator-xAI Responses-proxy te routeren.
Afstemming van `code_execution` staat onder `plugins.entries.xai.config.codeExecution`.
</Note>

## Ingebouwde catalogus

OpenClaw bevat standaard deze xAI-modelfamilies:

| Familie       | Model-id's                                                               |
| ------------- | ------------------------------------------------------------------------ |
| Grok 3        | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3      | `grok-4.3`                                                               |
| Grok 4        | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast   | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code     | `grok-code-fast-1`                                                       |

De Plugin resolveert ook nieuwere `grok-4*`- en `grok-code-fast*`-id's door wanneer
ze dezelfde API-vorm volgen.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` en de `grok-4.20-beta-*`-
varianten zijn de huidige Grok-referenties met beeldondersteuning in de gebundelde catalogus.
</Tip>

## OpenClaw-functiedekking

De gebundelde Plugin brengt het huidige openbare API-oppervlak van xAI in kaart op de gedeelde
provider- en toolcontracten van OpenClaw. Mogelijkheden die niet in het gedeelde contract passen
(bijvoorbeeld streaming-TTS en realtime spraak) worden niet beschikbaar gemaakt - zie de tabel
hieronder.

| xAI-mogelijkheid          | OpenClaw-oppervlak                       | Status                                                              |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses          | `xai/<model>`-modelprovider              | Ja                                                                  |
| Server-side web search    | `web_search`-provider `grok`             | Ja                                                                  |
| Server-side X-zoekactie   | `x_search`-tool                          | Ja                                                                  |
| Server-side code execution | `code_execution`-tool                    | Ja                                                                  |
| Afbeeldingen              | `image_generate`                         | Ja                                                                  |
| Video's                   | `video_generate`                         | Ja                                                                  |
| Batch tekst-naar-spraak   | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                  |
| Streaming-TTS             | -                                        | Niet beschikbaar gemaakt; het TTS-contract van OpenClaw retourneert volledige audiobuffers |
| Batch spraak-naar-tekst   | `tools.media.audio` / mediabegrip        | Ja                                                                  |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "xai"`  | Ja                                                                  |
| Realtime spraak           | -                                        | Nog niet beschikbaar gemaakt; ander sessie-/WebSocket-contract      |
| Bestanden / batches       | Alleen generieke model-API-compatibiliteit | Geen eersteklas OpenClaw-tool                                      |

<Note>
OpenClaw gebruikt de REST-API's voor afbeeldingen/video/TTS/STT van xAI voor mediageneratie,
spraak en batchtranscriptie, de streaming-STT-WebSocket van xAI voor live
transcriptie van spraakoproepen, en de Responses-API voor model-, zoek- en
code-uitvoeringstools. Functies waarvoor andere OpenClaw-contracten nodig zijn, zoals
Realtime-spraaksessies, worden hier gedocumenteerd als upstream-mogelijkheden in plaats
van verborgen Plugin-gedrag.
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

| Legacy-alias              | Canonieke id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Functies

<AccordionGroup>
  <Accordion title="Web search">
    De gebundelde `grok`-webzoekprovider gebruikt ook `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogeneratie">
    De gebundelde `xai` Plugin registreert videogeneratie via de gedeelde
    `video_generate`-tool.

    - Standaard videomodel: `xai/grok-imagine-video`
    - Modi: tekst-naar-video, afbeelding-naar-video, generatie met referentieafbeelding, externe
      videobewerking en externe video-uitbreiding
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluties: `480P`, `720P`
    - Duur: 1-15 seconden voor generatie/afbeelding-naar-video, 1-10 seconden bij
      gebruik van `reference_image`-rollen, 2-10 seconden voor uitbreiding
    - Generatie met referentieafbeelding: stel `imageRoles` in op `reference_image` voor
      elke aangeleverde afbeelding; xAI accepteert maximaal 7 zulke afbeeldingen

    <Warning>
    Lokale videobuffers worden niet geaccepteerd. Gebruik externe `http(s)`-URL's voor
    video-invoer voor bewerken/uitbreiden. Afbeelding-naar-video accepteert lokale afbeeldingsbuffers omdat
    OpenClaw die als data-URL's voor xAI kan coderen.
    </Warning>

    Om xAI als standaard videoprovider te gebruiken:

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

  <Accordion title="Afbeeldingsgeneratie">
    De gebundelde `xai` Plugin registreert afbeeldingsgeneratie via de gedeelde
    `image_generate`-tool.

    - Standaard afbeeldingsmodel: `xai/grok-imagine-image`
    - Extra model: `xai/grok-imagine-image-pro`
    - Modi: tekst-naar-afbeelding en bewerking met referentieafbeelding
    - Referentie-invoer: één `image` of maximaal vijf `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluties: `1K`, `2K`
    - Aantal: maximaal 4 afbeeldingen

    OpenClaw vraagt xAI om `b64_json`-afbeeldingsreacties zodat gegenereerde media kunnen worden
    opgeslagen en geleverd via het normale pad voor kanaalbijlagen. Lokale
    referentieafbeeldingen worden geconverteerd naar data-URL's; externe `http(s)`-referenties worden
    doorgegeven.

    Om xAI als standaard afbeeldingsprovider te gebruiken:

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
    xAI documenteert ook `quality`, `mask`, `user` en extra native verhoudingen
    zoals `1:2`, `2:1`, `9:20` en `20:9`. OpenClaw stuurt vandaag alleen de
    gedeelde afbeeldingsbesturingselementen voor meerdere providers door; niet-ondersteunde native-only knoppen
    worden bewust niet beschikbaar gemaakt via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Tekst-naar-spraak">
    De gebundelde `xai` Plugin registreert tekst-naar-spraak via het gedeelde `tts`-
    provideroppervlak.

    - Stemmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standaardstem: `eve`
    - Formaten: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Taal: BCP-47-code of `auto`
    - Snelheid: provider-native snelheidsoverschrijving
    - Native Opus-spraaknotitieformaat wordt niet ondersteund

    Om xAI als standaard TTS-provider te gebruiken:

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
    OpenClaw gebruikt het batch-`/v1/tts`-endpoint van xAI. xAI biedt ook streaming-TTS
    via WebSocket, maar het spraakprovidercontract van OpenClaw verwacht momenteel
    een volledige audiobuffer voordat een antwoord wordt geleverd.
    </Note>

  </Accordion>

  <Accordion title="Spraak-naar-tekst">
    De gebundelde `xai` Plugin registreert batch spraak-naar-tekst via het
    transcriptieoppervlak voor mediabegrip van OpenClaw.

    - Standaardmodel: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Invoerpad: multipart-upload van audiobestand
    - Ondersteund door OpenClaw overal waar transcriptie van binnenkomende audio
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en
      kanaalaudiobijlagen

    Om xAI af te dwingen voor transcriptie van binnenkomende audio:

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

    Taal kan worden opgegeven via de gedeelde audiomediaconfiguratie of per
    transcriptieverzoek. Prompt-hints worden geaccepteerd door het gedeelde OpenClaw-
    oppervlak, maar de xAI REST STT-integratie stuurt alleen bestand, model en
    taal door omdat die netjes overeenkomen met het huidige openbare xAI-endpoint.

  </Accordion>

  <Accordion title="Streaming spraak-naar-tekst">
    De gebundelde `xai` Plugin registreert ook een realtime transcriptieprovider
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

    Configuratie die eigendom is van de provider staat onder
    `plugins.entries.voice-call.config.streaming.providers.xai`. Ondersteunde
    sleutels zijn `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` of
    `alaw`), `interimResults`, `endpointingMs` en `language`.

    <Note>
    Deze streamingprovider is bedoeld voor het realtime transcriptiepad van Voice Call.
    Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batchgewijze
    transcriptiepad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    De meegeleverde xAI-Plugin stelt `x_search` beschikbaar als OpenClaw-tool om
    X-content (voorheen Twitter) te doorzoeken via Grok.

    Configuratiepad: `plugins.entries.xai.config.xSearch`

    | Sleutel            | Type    | Standaard          | Beschrijving                         |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Schakel x_search in of uit           |
    | `model`            | string  | `grok-4-1-fast`    | Model dat wordt gebruikt voor x_search-verzoeken |
    | `baseUrl`          | string  | -                  | Overschrijving van de xAI Responses-basis-URL |
    | `inlineCitations`  | boolean | -                  | Neem inline citaties op in resultaten |
    | `maxTurns`         | number  | -                  | Maximumaantal gespreksbeurten        |
    | `timeoutSeconds`   | number  | -                  | Time-out van verzoek in seconden     |
    | `cacheTtlMinutes`  | number  | -                  | Time-to-live van cache in minuten    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    De meegeleverde xAI-Plugin stelt `code_execution` beschikbaar als OpenClaw-tool voor
    externe code-uitvoering in de sandboxomgeving van xAI.

    Configuratiepad: `plugins.entries.xai.config.codeExecution`

    | Sleutel           | Type    | Standaard          | Beschrijving                          |
    | ----------------- | ------- | ------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true` (als sleutel beschikbaar is) | Schakel code-uitvoering in of uit |
    | `model`           | string  | `grok-4-1-fast`    | Model dat wordt gebruikt voor code-uitvoeringsverzoeken |
    | `maxTurns`        | number  | -                  | Maximumaantal gespreksbeurten         |
    | `timeoutSeconds`  | number  | -                  | Time-out van verzoek in seconden      |

    <Note>
    Dit is externe xAI-sandboxuitvoering, niet lokale [`exec`](/nl/tools/exec).
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

  <Accordion title="Known limits">
    - Auth gebruikt vandaag alleen API-sleutels. Er is nog geen xAI OAuth- of apparaatcodeflow in
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` wordt niet ondersteund op het
      normale xAI-providerpad, omdat het een ander upstream API-oppervlak vereist
      dan het standaard OpenClaw xAI-transport.
    - xAI Realtime-spraak is nog niet geregistreerd als OpenClaw-provider. Het
      heeft een ander bidirectioneel spraaksessiecontract nodig dan batch-STT of
      streamingtranscriptie.
    - xAI-afbeeldings`quality`, afbeeldings`mask` en extra native-only beeldverhoudingen worden
      niet beschikbaar gesteld totdat de gedeelde tool `image_generate` bijbehorende
      cross-provider controls heeft.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw past automatisch xAI-specifieke compatibiliteitsoplossingen voor toolschema's en tool-calls toe
      op het gedeelde runnerpad.
    - Native xAI-verzoeken gebruiken standaard `tool_stream: true`. Stel
      `agents.defaults.models["xai/<model>"].params.tool_stream` in op `false` om
      dit uit te schakelen.
    - De meegeleverde xAI-wrapper verwijdert niet-ondersteunde strikte toolschema-vlaggen en
      reasoning-payloadsleutels voordat native xAI-verzoeken worden verzonden.
    - `web_search`, `x_search` en `code_execution` worden beschikbaar gesteld als OpenClaw-
      tools. OpenClaw schakelt de specifieke ingebouwde xAI-functie in die nodig is binnen elk tool-
      verzoek, in plaats van alle native tools aan elke chatbeurt te koppelen.
    - Grok `web_search` leest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` leest `plugins.entries.xai.config.xSearch.baseUrl` en
      valt daarna terug op de Grok-webzoekbasis-URL.
    - `x_search` en `code_execution` zijn eigendom van de meegeleverde xAI-Plugin en zijn
      niet hardcoded in de kernmodelruntime.
    - `code_execution` is externe xAI-sandboxuitvoering, niet lokale
      [`exec`](/nl/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testen

De xAI-mediapaden worden gedekt door unit tests en opt-in live suites. De live
commando's laden secrets uit je login-shell, inclusief `~/.profile`, voordat
`XAI_API_KEY` wordt gecontroleerd.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Het providerspecifieke livebestand synthetiseert normale TTS, telefonievriendelijke PCM-
TTS, transcribeert audio via xAI batch-STT, streamt dezelfde PCM via xAI
realtime-STT, genereert tekst-naar-afbeelding-uitvoer en bewerkt een referentieafbeelding. Het
gedeelde livebestand voor afbeeldingen verifieert dezelfde xAI-provider via OpenClaw's
runtimeselectie, fallback, normalisatie en media-bijlagepad.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Video generation" href="/nl/tools/video-generation" icon="video">
    Gedeelde videotoolparameters en providerselectie.
  </Card>
  <Card title="All providers" href="/nl/providers/index" icon="grid-2">
    Het bredere provideroverzicht.
  </Card>
  <Card title="Troubleshooting" href="/nl/help/troubleshooting" icon="wrench">
    Veelvoorkomende problemen en oplossingen.
  </Card>
</CardGroup>
