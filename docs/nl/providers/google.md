---
read_when:
    - Je wilt Google Gemini-modellen gebruiken met OpenClaw
    - Je hebt de API-sleutel of de OAuth-authenticatiestroom nodig
summary: Google Gemini-configuratie (API-sleutel + OAuth, afbeeldingsgeneratie, mediabegrip, TTS, zoeken op het web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-29T23:10:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

De Google-Plugin biedt toegang tot Gemini-modellen via Google AI Studio, plus
beeldgeneratie, mediabegrip (afbeelding/audio/video), tekst-naar-spraak en webzoekopdrachten via
Gemini Grounding.

- Provider: `google`
- Authenticatie: `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime-optie: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  hergebruikt Gemini CLI OAuth terwijl modelverwijzingen canoniek blijven als `google/*`.

## Aan de slag

Kies je gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="API-sleutel">
    **Het beste voor:** standaardtoegang tot de Gemini API via Google AI Studio.

    <Steps>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    De omgevingsvariabelen `GEMINI_API_KEY` en `GOOGLE_API_KEY` worden beide geaccepteerd. Gebruik degene die je al hebt geconfigureerd.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Het beste voor:** een bestaande Gemini CLI-login via PKCE OAuth hergebruiken in plaats van een afzonderlijke API-sleutel.

    <Warning>
    De `google-gemini-cli`-provider is een onofficiële integratie. Sommige gebruikers
    melden accountbeperkingen wanneer OAuth op deze manier wordt gebruikt. Gebruik dit op eigen risico.
    </Warning>

    <Steps>
      <Step title="De Gemini CLI installeren">
        De lokale opdracht `gemini` moet beschikbaar zijn op `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw ondersteunt zowel Homebrew-installaties als globale npm-installaties, inclusief
        gangbare Windows/npm-indelingen.
      </Step>
      <Step title="Inloggen via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Controleren of het model beschikbaar is">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Standaardmodel: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    De Gemini API-model-id van Gemini 3.1 Pro is `gemini-3.1-pro-preview`. OpenClaw accepteert de kortere `google/gemini-3.1-pro` als handige alias en normaliseert die vóór provideraanroepen.

    **Omgevingsvariabelen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Of de `GEMINI_CLI_*`-varianten.)

    <Note>
    Als Gemini CLI OAuth-aanvragen na het inloggen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of
    `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host en probeer het opnieuw.
    </Note>

    <Note>
    Als inloggen mislukt voordat de browserflow start, controleer dan of de lokale opdracht `gemini`
    is geïnstalleerd en op `PATH` staat.
    </Note>

    `google-gemini-cli/*`-modelverwijzingen zijn verouderde compatibiliteitsaliassen. Nieuwe
    configuraties moeten `google/*`-modelverwijzingen gebruiken plus de `google-gemini-cli`-
    runtime wanneer ze lokale Gemini CLI-uitvoering willen.

  </Tab>
</Tabs>

## Mogelijkheden

| Mogelijkheid            | Ondersteund                    |
| ----------------------- | ------------------------------ |
| Chatvoltooiingen        | Ja                             |
| Beeldgeneratie          | Ja                             |
| Muziekgeneratie         | Ja                             |
| Tekst-naar-spraak       | Ja                             |
| Realtime spraak         | Ja (Google Live API)           |
| Afbeeldingsbegrip       | Ja                             |
| Audiotranscriptie       | Ja                             |
| Videobegrip             | Ja                             |
| Webzoekopdracht (Grounding) | Ja                         |
| Denken/redeneren        | Ja (Gemini 2.5+ / Gemini 3+)   |
| Gemma 4-modellen        | Ja                             |

<Tip>
Gemini 3-modellen gebruiken `thinkingLevel` in plaats van `thinkingBudget`. OpenClaw koppelt
redeneerinstellingen van Gemini 3, Gemini 3.1 en de `gemini-*-latest`-alias aan
`thinkingLevel`, zodat standaardruns/runs met lage latentie geen uitgeschakelde
`thinkingBudget`-waarden verzenden.

`/think adaptive` behoudt de dynamische denksemantiek van Google in plaats van
een vast OpenClaw-niveau te kiezen. Gemini 3 en Gemini 3.1 laten een vaste `thinkingLevel` weg, zodat
Google het niveau kan kiezen; Gemini 2.5 verzendt Googles dynamische sentinel
`thinkingBudget: -1`.

Gemma 4-modellen (bijvoorbeeld `gemma-4-26b-a4b-it`) ondersteunen denkmodus. OpenClaw
herschrijft `thinkingBudget` naar een ondersteund Google-`thinkingLevel` voor Gemma 4.
Als denken op `off` wordt ingesteld, blijft denken uitgeschakeld in plaats van te worden gekoppeld aan
`MINIMAL`.
</Tip>

## Beeldgeneratie

De meegeleverde `google`-provider voor beeldgeneratie gebruikt standaard
`google/gemini-3.1-flash-image-preview`.

- Ondersteunt ook `google/gemini-3-pro-image-preview`
- Genereren: maximaal 4 afbeeldingen per aanvraag
- Bewerkmodus: ingeschakeld, maximaal 5 invoerafbeeldingen
- Geometrie-instellingen: `size`, `aspectRatio` en `resolution`

Google als standaardprovider voor afbeeldingen gebruiken:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Zie [Beeldgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Videogeneratie

De meegeleverde `google`-Plugin registreert ook videogeneratie via de gedeelde
`video_generate`-tool.

- Standaardvideomodel: `google/veo-3.1-fast-generate-preview`
- Modi: tekst-naar-video, afbeelding-naar-video en referentieflows met één video
- Ondersteunt `aspectRatio`, `resolution` en `audio`
- Huidige duurklem: **4 tot 8 seconden**

Google als standaardprovider voor video gebruiken:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Zie [Videogeneratie](/nl/tools/video-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Muziekgeneratie

De meegeleverde `google`-Plugin registreert ook muziekgeneratie via de gedeelde
`music_generate`-tool.

- Standaardmuziekmodel: `google/lyria-3-clip-preview`
- Ondersteunt ook `google/lyria-3-pro-preview`
- Promptinstellingen: `lyrics` en `instrumental`
- Uitvoerindeling: standaard `mp3`, plus `wav` op `google/lyria-3-pro-preview`
- Referentie-invoer: maximaal 10 afbeeldingen
- Sessieondersteunde runs worden losgekoppeld via de gedeelde taak-/statusflow, inclusief `action: "status"`

Google als standaardprovider voor muziek gebruiken:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Zie [Muziekgeneratie](/nl/tools/music-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Tekst-naar-spraak

De meegeleverde `google`-spraakprovider gebruikt het Gemini API TTS-pad met
`gemini-3.1-flash-tts-preview`.

- Standaardstem: `Kore`
- Authenticatie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- Uitvoer: WAV voor gewone TTS-bijlagen, Opus voor spraaknotitiedoelen, PCM voor Talk/telefonie
- Spraaknotitie-uitvoer: Google PCM wordt verpakt als WAV en getranscodeerd naar 48 kHz Opus met `ffmpeg`

Google als standaard-TTS-provider gebruiken:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS gebruikt prompts in natuurlijke taal voor stijlregeling. Stel
`audioProfile` in om een herbruikbare stijlprompt vóór de uitgesproken tekst te plaatsen. Stel
`speakerName` in wanneer je prompttekst naar een genoemde spreker verwijst.

Gemini API TTS accepteert ook expressieve audiotags tussen vierkante haken in de tekst,
zoals `[whispers]` of `[laughs]`. Om tags uit het zichtbare chatantwoord te houden
terwijl ze naar TTS worden verzonden, plaats je ze in een `[[tts:text]]...[[/tts:text]]`-
blok:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Een Google Cloud Console-API-sleutel die is beperkt tot de Gemini API is geldig voor deze
provider. Dit is niet het afzonderlijke Cloud Text-to-Speech API-pad.
</Note>

## Realtime spraak

De meegeleverde `google`-Plugin registreert een realtime spraakprovider die wordt ondersteund door de
Gemini Live API voor backend-audiobruggen zoals Voice Call en Google Meet.

| Instelling            | Configuratiepad                                                     | Standaard                                                                             |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stem                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatuur           | `...google.temperature`                                             | (niet ingesteld)                                                                      |
| VAD-startgevoeligheid | `...google.startSensitivity`                                        | (niet ingesteld)                                                                      |
| VAD-eindgevoeligheid  | `...google.endSensitivity`                                          | (niet ingesteld)                                                                      |
| Stilteduur            | `...google.silenceDurationMs`                                       | (niet ingesteld)                                                                      |
| Activiteitsafhandeling | `...google.activityHandling`                                       | Google-standaard, `start-of-activity-interrupts`                                      |
| Beurtdekking          | `...google.turnCoverage`                                            | Google-standaard, `only-activity`                                                     |
| Automatische VAD uitschakelen | `...google.automaticActivityDetectionDisabled`               | `false`                                                                               |
| API-sleutel           | `...google.apiKey`                                                  | Valt terug op `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY` |

Voorbeeldconfiguratie voor Voice Call realtime:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API gebruikt bidirectionele audio en functieaanroepen via een WebSocket.
OpenClaw past audio van telefonie-/Meet-bruggen aan de PCM Live API-stream van Gemini aan en
houdt toolaanroepen op het gedeelde realtime spraakcontract. Laat `temperature`
uitgeschakeld tenzij je samplingwijzigingen nodig hebt; OpenClaw laat niet-positieve waarden weg
omdat Google Live transcripties zonder audio kan retourneren voor `temperature: 0`.
Gemini API-transcriptie is ingeschakeld zonder `languageCodes`; de huidige Google
SDK weigert taalcodehints op dit API-pad.
</Note>

<Note>
Control UI Talk ondersteunt Google Live-browsersessies met beperkte tokens voor eenmalig gebruik.
Backend-only realtime spraakproviders kunnen ook via het generieke
Gateway-relaytransport lopen, waardoor providerreferenties op de Gateway blijven.
</Note>

Voer voor liveverificatie door maintainers
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` uit.
De Google-tak maakt dezelfde beperkte Live API-tokenvorm aan die door Control
UI Talk wordt gebruikt, opent het browser-WebSocket-eindpunt, verzendt de initiële set-up-payload
en wacht op `setupComplete`.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Direct Gemini-cachehergebruik">
    Voor directe Gemini API-runs (`api: "google-generative-ai"`) geeft OpenClaw
    een geconfigureerde `cachedContent`-handle door aan Gemini-verzoeken.

    - Configureer per-model- of globale parameters met
      `cachedContent` of verouderd `cached_content`
    - Als beide aanwezig zijn, wint `cachedContent`
    - Voorbeeldwaarde: `cachedContents/prebuilt-context`
    - Gemini-cachehitgebruik wordt genormaliseerd naar OpenClaw `cacheRead` vanuit
      upstream `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gebruiksnotities voor Gemini CLI JSON">
    Bij gebruik van de `google-gemini-cli` OAuth-provider normaliseert OpenClaw
    de CLI JSON-uitvoer als volgt:

    - Antwoordtekst komt uit het CLI JSON-veld `response`.
    - Gebruik valt terug op `stats` wanneer de CLI `usage` leeg laat.
    - `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
    - Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Omgevings- en daemonconfiguratie">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `GEMINI_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingsgeneratie" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Videogeneratie" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Muziekgeneratie" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor muziektools en providerselectie.
  </Card>
</CardGroup>
