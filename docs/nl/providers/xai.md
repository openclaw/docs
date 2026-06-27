---
read_when:
    - Je wilt Grok-modellen gebruiken in OpenClaw
    - Je configureert xAI-authenticatie of model-id's
summary: Gebruik xAI Grok-modellen in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:16:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw levert een gebundelde `xai`-provider-Plugin voor Grok-modellen. Voor de meeste
gebruikers is het aanbevolen pad Grok OAuth met een geschikt SuperGrok- of X Premium-
abonnement. OpenClaw blijft local-first: de Gateway, configuratie, routering en
tools draaien op je machine, terwijl Grok-modelaanvragen via xAI authenticeren
en naar de API van xAI worden verzonden.

OAuth vereist geen xAI API-sleutel en vereist de Grok Build-
app niet. xAI kan Grok Build nog steeds op het toestemmingsscherm tonen, omdat OpenClaw
de gedeelde OAuth-client van xAI gebruikt.

## Kies je installatiepad

Gebruik het pad dat past bij de installatiestatus van je OpenClaw:

<Steps>
  <Step title="Nieuwe OpenClaw-installatie">
    Voer onboarding uit met daemon-installatie wanneer je een nieuwe lokale
    Gateway instelt, en kies daarna de xAI/Grok OAuth-optie in de model-/auth-stap:

    ```bash
    openclaw onboard --install-daemon
    ```

    Selecteer op een VPS of via SSH direct xAI OAuth; OpenClaw gebruikt verificatie
    met apparaatcode en vereist geen localhost-callback:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth vereist geen xAI API-sleutel. OpenClaw vereist de Grok
    Build-app niet. xAI kan de toestemmingsapp nog steeds als Grok Build labelen, omdat
    OpenClaw de gedeelde OAuth-client van xAI gebruikt.

  </Step>
  <Step title="Bestaande OpenClaw-installatie">
    Als OpenClaw al is geconfigureerd, log dan alleen in bij xAI. Voer geen volledige
    onboarding opnieuw uit en installeer de daemon niet opnieuw alleen om Grok te verbinden:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Om Grok na het inloggen het standaardmodel te maken, pas je dit apart toe:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Voer volledige onboarding alleen opnieuw uit als je bewust Gateway,
    daemon, kanaal, werkruimte of andere installatiekeuzes wilt wijzigen.

  </Step>
  <Step title="API-sleutelpad">
    Installatie met API-sleutel werkt nog steeds voor xAI Console-sleutels en voor media-oppervlakken die
    providerconfiguratie op basis van sleutels vereisen:

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
credential van `openclaw models auth login --provider xai --method oauth` of
`openclaw models auth login --provider xai --method api-key` kan ook eersteklas
`web_search`, `x_search`, externe `code_execution` en xAI-afbeeldings-/videogeneratie aandrijven.
Spraak en transcriptie vereisen momenteel `XAI_API_KEY` of providerconfiguratie.
Door Grok ondersteunde `web_search` geeft de voorkeur aan xAI OAuth en valt terug op `XAI_API_KEY` of
Plugin-webzoekconfiguratie.
Als je een xAI-sleutel opslaat onder `plugins.entries.xai.config.webSearch.apiKey`,
hergebruikt de gebundelde xAI-modelprovider die sleutel ook als fallback.
Stel `plugins.entries.xai.config.webSearch.baseUrl` in om Grok `web_search`
en standaard `x_search` via een operator-xAI Responses-proxy te routeren.
Afstemming van `code_execution` staat onder `plugins.entries.xai.config.codeExecution`.
</Note>

## OAuth-probleemoplossing

- Gebruik voor SSH, Docker, VPS of andere externe installaties
  `openclaw models auth login --provider xai --method oauth`; xAI OAuth gebruikt
  verificatie met apparaatcode in plaats van een localhost-callback.
- Als inloggen slaagt maar Grok niet het standaardmodel is, voer dan
  `openclaw models set xai/grok-4.3` uit.
- Om opgeslagen xAI-authprofielen te inspecteren, voer je uit:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI bepaalt welke accounts OAuth API-tokens kunnen ontvangen. Als een account niet
  in aanmerking komt, probeer dan het API-sleutelpad of controleer het abonnement aan de kant van xAI.

<Tip>
Gebruik `xai-oauth` wanneer je inlogt vanaf SSH, Docker of een VPS. OpenClaw drukt een
xAI-URL en korte code af; voltooi het inloggen in een lokale browser terwijl het externe
proces xAI peilt voor de voltooide tokenuitwisseling.
</Tip>

## Ingebouwde catalogus

OpenClaw bevat de huidige xAI-chatmodellen standaard, gesorteerd van nieuwste
naar oudste in modelkiezers:

| Familie        | Model-id's                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

De Plugin blijft oudere Grok 3-, Grok 4-, Grok 4 Fast-, Grok 4.1
Fast- en Grok Code-slugs voor bestaande configuraties vooruit oplossen. Officiële Grok Code Fast-aliassen
normaliseren naar `grok-build-0.1`; OpenClaw toont de andere ingetrokken
upstream-slugs niet meer in de selecteerbare catalogus.

<Tip>
Gebruik `grok-4.3` voor algemene chat en `grok-build-0.1` voor build-/codinggerichte
workloads, tenzij je expliciet een Grok 4.20 beta-alias nodig hebt.
</Tip>

## OpenClaw-functiedekking

De gebundelde Plugin koppelt het huidige openbare API-oppervlak van xAI aan de gedeelde
provider- en toolcontracten van OpenClaw. Mogelijkheden die niet in het gedeelde contract passen
(bijvoorbeeld streaming TTS en realtime spraak) worden niet blootgesteld - zie de tabel
hieronder.

| xAI-mogelijkheid           | OpenClaw-oppervlak                       | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>`-modelprovider              | Ja                                                                  |
| Server-side web search     | `web_search`-provider `grok`             | Ja                                                                  |
| Server-side X search       | `x_search`-tool                          | Ja                                                                  |
| Server-side code execution | `code_execution`-tool                    | Ja                                                                  |
| Afbeeldingen               | `image_generate`                         | Ja                                                                  |
| Video's                    | `video_generate`                         | Ja                                                                  |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                  |
| Streaming TTS              | -                                         | Niet blootgesteld; het TTS-contract van OpenClaw retourneert volledige audiobuffers |
| Batch speech-to-text       | `tools.media.audio` / mediabegrip        | Ja                                                                  |
| Streaming speech-to-text   | Spraakoproep `streaming.provider: "xai"` | Ja                                                                  |
| Realtime spraak            | -                                         | Nog niet blootgesteld; ander sessie-/WebSocket-contract             |
| Bestanden / batches        | Alleen generieke model-API-compatibiliteit | Geen eersteklas OpenClaw-tool                                      |

<Note>
OpenClaw gebruikt de REST-API's voor afbeeldingen/video/TTS/STT van xAI voor mediageneratie,
spraak en batchtranscriptie, de streaming STT-WebSocket van xAI voor live
spraakoproeptranscriptie, en de Responses API voor model-, zoek- en
code-uitvoeringstools. Functies die andere OpenClaw-contracten nodig hebben, zoals
Realtime-spraaksessies, worden hier gedocumenteerd als upstream-mogelijkheden in plaats
van verborgen Plugin-gedrag.
</Note>

### Fast-mode-toewijzingen

`/fast on` of `agents.defaults.models["xai/<model>"].params.fastMode: true`
herschrijft native xAI-aanvragen als volgt:

| Bronmodel     | Fast-mode-doel    |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Legacy-compatibiliteitsaliassen

Legacy-aliassen normaliseren nog steeds naar de canonieke gebundelde id's:

| Legacy-alias              | Canonieke id                         |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Functies

<AccordionGroup>
  <Accordion title="Webzoekopdracht">
    De gebundelde `grok`-webzoekprovider geeft de voorkeur aan xAI OAuth en valt daarna terug
    op `XAI_API_KEY` of een Plugin-webzoeksleutel:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogeneratie">
    De gebundelde `xai`-Plugin registreert videogeneratie via de gedeelde
    `video_generate`-tool.

    - Standaardvideomodel: `xai/grok-imagine-video`
    - Modi: tekst-naar-video, afbeelding-naar-video, generatie met referentieafbeelding, externe
      videobewerking en externe videoverlenging
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluties: `480P`, `720P`
    - Duur: 1-15 seconden voor generatie/afbeelding-naar-video, 1-10 seconden wanneer
      `reference_image`-rollen worden gebruikt, 2-10 seconden voor verlenging
    - Generatie met referentieafbeelding: stel `imageRoles` in op `reference_image` voor
      elke aangeleverde afbeelding; xAI accepteert maximaal 7 van zulke afbeeldingen
    - Standaardtime-out voor bewerking: 600 seconden, tenzij `video_generate.timeoutMs`
      of `agents.defaults.videoGenerationModel.timeoutMs` is ingesteld

    <Warning>
    Lokale videobuffers worden niet geaccepteerd. Gebruik externe `http(s)`-URL's voor
    invoer voor videobewerking/-verlenging. Afbeelding-naar-video accepteert lokale afbeeldingsbuffers omdat
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

  <Accordion title="Afbeeldingsgeneratie">
    De gebundelde `xai`-Plugin registreert afbeeldingsgeneratie via de gedeelde
    `image_generate`-tool.

    - Standaardafbeeldingsmodel: `xai/grok-imagine-image`
    - Extra model: `xai/grok-imagine-image-quality`
    - Modi: tekst-naar-afbeelding en bewerking met referentieafbeelding
    - Referentie-invoer: één `image` of maximaal vijf `images`
    - Beeldverhoudingen: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluties: `1K`, `2K`
    - Aantal: maximaal 4 afbeeldingen
    - Standaardtime-out voor bewerking: 600 seconden, tenzij `image_generate.timeoutMs`
      of `agents.defaults.imageGenerationModel.timeoutMs` is ingesteld

    OpenClaw vraagt xAI om `b64_json`-afbeeldingsresponses, zodat gegenereerde media kunnen worden
    opgeslagen en geleverd via het normale pad voor kanaalbijlagen. Lokale
    referentieafbeeldingen worden geconverteerd naar data-URL's; externe `http(s)`-referenties worden
    doorgegeven.

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
    zoals `1:2`, `2:1`, `9:20` en `20:9`. OpenClaw stuurt momenteel alleen de
    gedeelde afbeeldingsbesturingen voor meerdere providers door; niet-ondersteunde native-only knoppen
    worden bewust niet via `image_generate` beschikbaar gemaakt.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    De gebundelde `xai`-plugin registreert tekst-naar-spraak via het gedeelde `tts`-
    provideroppervlak.

    - Stemmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standaardstem: `eve`
    - Indelingen: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Taal: BCP-47-code of `auto`
    - Snelheid: provider-native snelheidsoverschrijving
    - Native Opus-indeling voor spraaknotities wordt niet ondersteund

    xAI als standaard-TTS-provider gebruiken:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw gebruikt xAI's batch-`/v1/tts`-endpoint. xAI biedt ook streaming-TTS
    via WebSocket, maar het spraakprovidercontract van OpenClaw verwacht momenteel
    een volledige audiobuffer voordat het antwoord wordt afgeleverd.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    De gebundelde `xai`-plugin registreert batch-spraak-naar-tekst via OpenClaw's
    transcriptieoppervlak voor media-inzicht.

    - Standaardmodel: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Invoerpad: multipart-upload van audiobestand
    - Ondersteund door OpenClaw overal waar transcriptie van inkomende audio
      `tools.media.audio` gebruikt, inclusief Discord-spraakkanaalsegmenten en
      kanaalaudiobijlagen

    xAI forceren voor transcriptie van inkomende audio:

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
    taal door omdat die schoon aansluiten op het huidige openbare xAI-endpoint.

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    De gebundelde `xai`-plugin registreert ook een realtime transcriptieprovider
    voor live audio van spraakoproepen.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Standaardcodering: `mulaw`
    - Standaardsamplefrequentie: `8000`
    - Standaard endpointing: `800ms`
    - Tussentijdse transcripties: standaard ingeschakeld

    De Twilio-mediastream van Voice Call verzendt G.711 µ-law-audioframes, dus de
    xAI-provider kan die frames rechtstreeks doorsturen zonder transcodering:

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
    Discord-spraak neemt momenteel korte segmenten op en gebruikt in plaats daarvan het batch-
    `tools.media.audio`-transcriptiepad.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    De gebundelde xAI-plugin biedt `x_search` aan als OpenClaw-tool voor het zoeken
    in X-content (voorheen Twitter) via Grok.

    Configuratiepad: `plugins.entries.xai.config.xSearch`

    | Sleutel            | Type    | Standaard          | Beschrijving                         |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | Schakel x_search in of uit           |
    | `model`            | string  | `grok-4-1-fast`    | Model gebruikt voor x_search-verzoeken |
    | `baseUrl`          | string  | -                  | Overschrijving van xAI Responses-basis-URL |
    | `inlineCitations`  | boolean | -                  | Inline citaties opnemen in resultaten |
    | `maxTurns`         | number  | -                  | Maximaal aantal gespreksbeurten      |
    | `timeoutSeconds`   | number  | -                  | Verzoektime-out in seconden          |
    | `cacheTtlMinutes`  | number  | -                  | Cache time-to-live in minuten        |

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
    De gebundelde xAI-plugin biedt `code_execution` aan als OpenClaw-tool voor
    externe code-uitvoering in xAI's sandboxomgeving.

    Configuratiepad: `plugins.entries.xai.config.codeExecution`

    | Sleutel           | Type    | Standaard          | Beschrijving                         |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | `true` (als sleutel beschikbaar is) | Schakel code-uitvoering in of uit |
    | `model`           | string  | `grok-4-1-fast`    | Model gebruikt voor code-uitvoeringsverzoeken |
    | `maxTurns`        | number  | -                  | Maximaal aantal gespreksbeurten      |
    | `timeoutSeconds`  | number  | -                  | Verzoektime-out in seconden          |

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
    - xAI-authenticatie kan een API-sleutel, omgevingsvariabele, fallback van pluginconfiguratie
      of OAuth met een geschikt xAI-account gebruiken. OAuth gebruikt device-codeverificatie
      zonder localhost-callback. xAI bepaalt welke accounts OAuth-
      API-tokens kunnen ontvangen, en de toestemmingspagina kan Grok Build tonen, ook al vereist OpenClaw
      de Grok Build-app niet.
    - OpenClaw stelt de xAI multi-agent-modelfamilie momenteel niet beschikbaar. xAI
      levert deze modellen via de Responses API, maar ze accepteren de
      client-side of aangepaste tools niet die door OpenClaw's gedeelde agentloop worden gebruikt. Zie de
      [xAI multi-agent-beperkingen](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - xAI Realtime voice is nog niet geregistreerd als OpenClaw-provider. Hiervoor
      is een ander bidirectioneel spraaksessiecontract nodig dan batch-STT of
      streamingtranscriptie.
    - xAI-afbeelding `quality`, afbeelding `mask` en extra native-only beeldverhoudingen worden
      niet beschikbaar gemaakt totdat de gedeelde `image_generate`-tool overeenkomstige
      besturingen voor meerdere providers heeft.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw past xAI-specifieke compatibiliteitsfixes voor toolschema's en tool-calls
      automatisch toe op het gedeelde runnerpad.
    - Native xAI-verzoeken gebruiken standaard `tool_stream: true`. Stel
      `agents.defaults.models["xai/<model>"].params.tool_stream` in op `false` om
      dit uit te schakelen.
    - De gebundelde xAI-wrapper verwijdert niet-ondersteunde strikte toolschema-vlaggen en
      reasoning-*effort*-payloadsleutels voordat native xAI-verzoeken worden verzonden. Alleen
      `grok-4.3` / `grok-4.3-*` adverteren configureerbare reasoning effort; alle
      andere xAI-modellen met reasoning-mogelijkheden vragen nog steeds
      `include: ["reasoning.encrypted_content"]` aan zodat eerdere versleutelde reasoning
      opnieuw kan worden afgespeeld in vervolggespreksbeurten.
    - `web_search`, `x_search` en `code_execution` worden beschikbaar gemaakt als OpenClaw-
      tools. OpenClaw schakelt de specifieke ingebouwde xAI-functie in die nodig is binnen elk tool-
      verzoek, in plaats van alle native tools aan elke chatbeurt te koppelen.
    - Grok `web_search` leest `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` leest `plugins.entries.xai.config.xSearch.baseUrl` en
      valt daarna terug op de Grok web-search-basis-URL.
    - `x_search` en `code_execution` zijn eigendom van de gebundelde xAI-plugin in plaats van
      hardcoded in de core modelruntime.
    - `code_execution` is externe xAI-sandboxuitvoering, niet lokale
      [`exec`](/nl/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testen

De xAI-mediapaden worden gedekt door unittests en opt-in livesuites. Exporteer
`XAI_API_KEY` in de procesomgeving voordat je live probes uitvoert.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Het provider-specifieke livebestand synthetiseert normale TTS, telefonievriendelijke PCM-
TTS, transcribeert audio via xAI batch-STT, streamt dezelfde PCM via xAI
realtime-STT, genereert tekst-naar-afbeelding-uitvoer en bewerkt een referentieafbeelding. Het
gedeelde livebestand voor afbeeldingen verifieert dezelfde xAI-provider via OpenClaw's
runtime-selectie, fallback, normalisatie en media-bijlagepad.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
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
