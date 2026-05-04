---
read_when:
    - Je wilt Google Gemini-modellen gebruiken met OpenClaw
    - Je hebt de API-sleutel of OAuth-authenticatiestroom nodig
summary: Google Gemini instellen (API-sleutel + OAuth, beeldgeneratie, mediabegrip, TTS, zoeken op het web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T07:08:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

De Google Plugin biedt toegang tot Gemini-modellen via Google AI Studio, plus
afbeeldingsgeneratie, mediabegrip (afbeelding/audio/video), tekst-naar-spraak en webzoekfunctie via
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtimeoptie: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  hergebruikt Gemini CLI OAuth terwijl modelverwijzingen canoniek blijven als `google/*`.

## Aan de slag

Kies je gewenste auth-methode en volg de installatiestappen.

<Tabs>
  <Tab title="API-sleutel">
    **Het meest geschikt voor:** standaard Gemini API-toegang via Google AI Studio.

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
    De omgevingsvariabelen `GEMINI_API_KEY` en `GOOGLE_API_KEY` worden allebei geaccepteerd. Gebruik degene die je al hebt geconfigureerd.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Het meest geschikt voor:** het hergebruiken van een bestaande Gemini CLI-login via PKCE OAuth in plaats van een aparte API-sleutel.

    <Warning>
    De provider `google-gemini-cli` is een niet-officiële integratie. Sommige gebruikers
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

    De Gemini API-model-id van Gemini 3.1 Pro is `gemini-3.1-pro-preview`. OpenClaw accepteert de kortere `google/gemini-3.1-pro` als handige alias en normaliseert deze vóór provideraanroepen.

    **Omgevingsvariabelen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Of de varianten `GEMINI_CLI_*`.)

    <Note>
    Als Gemini CLI OAuth-aanvragen na het inloggen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of
    `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host en probeer het opnieuw.
    </Note>

    <Note>
    Als inloggen mislukt voordat de browserflow start, controleer dan of de lokale opdracht `gemini`
    is geïnstalleerd en op `PATH` staat.
    </Note>

    `google-gemini-cli/*`-modelverwijzingen zijn legacy-compatibiliteitsaliassen. Nieuwe
    configuraties moeten `google/*`-modelverwijzingen gebruiken plus de runtime `google-gemini-cli`
    wanneer ze lokale Gemini CLI-uitvoering willen.

  </Tab>
</Tabs>

## Mogelijkheden

| Mogelijkheid           | Ondersteund                   |
| ---------------------- | ----------------------------- |
| Chataanvullingen       | Ja                            |
| Afbeeldingsgeneratie   | Ja                            |
| Muziekgeneratie        | Ja                            |
| Tekst-naar-spraak      | Ja                            |
| Realtime spraak        | Ja (Google Live API)          |
| Afbeeldingsbegrip      | Ja                            |
| Audiotranscriptie      | Ja                            |
| Videobegrip            | Ja                            |
| Webzoekfunctie (Grounding) | Ja                        |
| Denken/redeneren       | Ja (Gemini 2.5+ / Gemini 3+)  |
| Gemma 4-modellen       | Ja                            |

## Webzoekfunctie

De meegeleverde webzoekprovider `gemini` gebruikt Gemini Google Search-grounding.
Configureer een speciale zoeksleutel onder `plugins.entries.google.config.webSearch`,
of laat deze `models.providers.google.apiKey` hergebruiken na `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

De volgorde van inloggegevens is eerst de speciale `webSearch.apiKey`, daarna `GEMINI_API_KEY`,
daarna `models.providers.google.apiKey`. `webSearch.baseUrl` is optioneel en
bestaat voor operator-proxy's of compatibele Gemini API-eindpunten; wanneer deze wordt weggelaten,
hergebruikt Gemini-webzoekfunctie `models.providers.google.baseUrl`. Zie
[Gemini-zoekfunctie](/nl/tools/gemini-search) voor het providerspecifieke toolgedrag.

<Tip>
Gemini 3-modellen gebruiken `thinkingLevel` in plaats van `thinkingBudget`. OpenClaw koppelt
redeneerbesturing voor Gemini 3, Gemini 3.1 en `gemini-*-latest`-aliassen aan
`thinkingLevel` zodat standaardruns/runs met lage latentie geen uitgeschakelde
`thinkingBudget`-waarden verzenden.

`/think adaptive` behoudt de dynamische denksemantiek van Google in plaats van een
vast OpenClaw-niveau te kiezen. Gemini 3 en Gemini 3.1 laten een vaste `thinkingLevel` weg zodat
Google het niveau kan kiezen; Gemini 2.5 verzendt Google's dynamische sentinel
`thinkingBudget: -1`.

Gemma 4-modellen (bijvoorbeeld `gemma-4-26b-a4b-it`) ondersteunen denkmodus. OpenClaw
herschrijft `thinkingBudget` naar een ondersteund Google `thinkingLevel` voor Gemma 4.
Als denken wordt ingesteld op `off`, blijft denken uitgeschakeld in plaats van te koppelen naar
`MINIMAL`.
</Tip>

## Afbeeldingsgeneratie

De meegeleverde afbeeldingsgeneratieprovider `google` gebruikt standaard
`google/gemini-3.1-flash-image-preview`.

- Ondersteunt ook `google/gemini-3-pro-image-preview`
- Genereren: tot 4 afbeeldingen per aanvraag
- Bewerkmodus: ingeschakeld, tot 5 invoerafbeeldingen
- Geometriebesturing: `size`, `aspectRatio` en `resolution`

Google gebruiken als standaard afbeeldingsprovider:

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
Zie [Afbeeldingsgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Videogeneratie

De meegeleverde `google` Plugin registreert ook videogeneratie via de gedeelde
tool `video_generate`.

- Standaard videomodel: `google/veo-3.1-fast-generate-preview`
- Modi: tekst-naar-video, afbeelding-naar-video en referentieflows met één video
- Ondersteunt `aspectRatio`, `resolution` en `audio`
- Huidige duurklem: **4 tot 8 seconden**

Google gebruiken als standaard videoprovider:

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

De meegeleverde `google` Plugin registreert ook muziekgeneratie via de gedeelde
tool `music_generate`.

- Standaard muziekmodel: `google/lyria-3-clip-preview`
- Ondersteunt ook `google/lyria-3-pro-preview`
- Promptbesturing: `lyrics` en `instrumental`
- Uitvoerformaat: standaard `mp3`, plus `wav` op `google/lyria-3-pro-preview`
- Referentie-invoer: tot 10 afbeeldingen
- Runs met sessiebacking worden losgekoppeld via de gedeelde taak-/statusflow, inclusief `action: "status"`

Google gebruiken als standaard muziekprovider:

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

De meegeleverde spraakprovider `google` gebruikt het Gemini API TTS-pad met
`gemini-3.1-flash-tts-preview`.

- Standaardstem: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- Uitvoer: WAV voor gewone TTS-bijlagen, Opus voor spraaknotitiedoelen, PCM voor Talk/telefonie
- Uitvoer voor spraaknotities: Google PCM wordt als WAV verpakt en met `ffmpeg` getranscodeerd naar 48 kHz Opus

Google gebruiken als standaard TTS-provider:

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

Gemini API TTS gebruikt prompts in natuurlijke taal voor stijlbesturing. Stel
`audioProfile` in om een herbruikbare stijlprompt vóór de gesproken tekst te plaatsen. Stel
`speakerName` in wanneer je prompttekst naar een benoemde spreker verwijst.

Gemini API TTS accepteert ook expressieve audiotags tussen vierkante haken in de tekst,
zoals `[whispers]` of `[laughs]`. Om tags buiten het zichtbare chatantwoord te houden
terwijl ze naar TTS worden verzonden, plaats je ze binnen een `[[tts:text]]...[[/tts:text]]`-blok:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Een Google Cloud Console API-sleutel die is beperkt tot de Gemini API is geldig voor deze
provider. Dit is niet het aparte Cloud Text-to-Speech API-pad.
</Note>

## Realtime spraak

De meegeleverde `google` Plugin registreert een realtime spraakprovider die wordt ondersteund door de
Gemini Live API voor backend-audiobruggen zoals Voice Call en Google Meet.

| Instelling                      | Configuratiepad                                                    | Standaardwaarde                                                                      |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                           | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stem                            | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatuur                     | `...google.temperature`                                             | (niet ingesteld)                                                                      |
| VAD-startgevoeligheid           | `...google.startSensitivity`                                        | (niet ingesteld)                                                                      |
| VAD-eindgevoeligheid            | `...google.endSensitivity`                                          | (niet ingesteld)                                                                      |
| Stilteduur                      | `...google.silenceDurationMs`                                       | (niet ingesteld)                                                                      |
| Activiteitsafhandeling          | `...google.activityHandling`                                        | Google-standaard, `start-of-activity-interrupts`                                      |
| Turn-dekking                    | `...google.turnCoverage`                                            | Google-standaard, `only-activity`                                                     |
| Automatische VAD uitschakelen   | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Sessiehervatting                | `...google.sessionResumption`                                       | `true`                                                                                |
| Contextcompressie               | `...google.contextWindowCompression`                                | `true`                                                                                |
| API-sleutel                     | `...google.apiKey`                                                  | Valt terug op `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY` |

Voorbeeld van realtime configuratie voor Voice Call:

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
Google Live API gebruikt bidirectionele audio en functie-aanroepen via een WebSocket.
OpenClaw past audio van telefonie-/Meet-bruggen aan voor Gemini's PCM Live API-stream en
houdt toolaanroepen op het gedeelde realtime spraakcontract. Laat `temperature`
niet ingesteld, tenzij je samplingwijzigingen nodig hebt; OpenClaw laat niet-positieve waarden weg
omdat Google Live transcripties zonder audio kan teruggeven voor `temperature: 0`.
Gemini API-transcriptie is ingeschakeld zonder `languageCodes`; de huidige Google
SDK weigert taalcodetips op dit API-pad.
</Note>

<Note>
Control UI Talk ondersteunt Google Live-browsersessies met beperkte tokens voor eenmalig gebruik.
Realtime spraakproviders die alleen backend zijn, kunnen ook via het generieke
Gateway-relaytransport draaien, waarbij providerreferenties op de Gateway blijven.
</Note>

Voor live verificatie door maintainers voer je
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` uit.
Het Google-deel mint dezelfde beperkte Live API-tokenvorm die Control
UI Talk gebruikt, opent het browser-WebSocket-eindpunt, verzendt de initiële setup-payload
en wacht op `setupComplete`.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Voor directe Gemini API-runs (`api: "google-generative-ai"`) geeft OpenClaw
    een geconfigureerde `cachedContent`-handle door aan Gemini-aanvragen.

    - Configureer parameters per model of globaal met
      `cachedContent` of legacy `cached_content`
    - Als beide aanwezig zijn, wint `cachedContent`
    - Voorbeeldwaarde: `cachedContents/prebuilt-context`
    - Cache-hitgebruik van Gemini wordt genormaliseerd naar OpenClaw `cacheRead` vanuit
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

  <Accordion title="Gemini CLI JSON usage notes">
    Bij gebruik van de OAuth-provider `google-gemini-cli` normaliseert OpenClaw
    de CLI JSON-uitvoer als volgt:

    - Antwoordtekst komt uit het CLI JSON-veld `response`.
    - Gebruik valt terug op `stats` wanneer de CLI `usage` leeg laat.
    - `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
    - Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `GEMINI_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Image generation" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Video generation" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Music generation" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor muziektools en providerselectie.
  </Card>
</CardGroup>
