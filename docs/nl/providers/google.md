---
read_when:
    - Je wilt Google Gemini-modellen gebruiken met OpenClaw
    - Je hebt de API-sleutel of de OAuth-authenticatieflow nodig
summary: Google Gemini instellen (API-sleutel + OAuth, beeldgeneratie, mediabegrip, TTS, webzoeken)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

De Google-Plugin biedt toegang tot Gemini-modellen via Google AI Studio, plus
afbeeldingsgeneratie, mediabegrip (afbeelding/audio/video), tekst-naar-spraak en webzoekopdrachten via
Gemini Grounding.

- Aanbieder: `google`
- Authenticatie: `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtimeoptie: provider/model `agentRuntime.id: "google-gemini-cli"`
  hergebruikt Gemini CLI OAuth terwijl modelverwijzingen canoniek blijven als `google/*`.

## Aan de slag

Kies je gewenste authenticatiemethode en volg de installatiestappen.

<Tabs>
  <Tab title="API-sleutel">
    **Het meest geschikt voor:** standaardtoegang tot de Gemini API via Google AI Studio.

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
    De provider `google-gemini-cli` is een onofficiële integratie. Sommige gebruikers
    melden accountbeperkingen wanneer ze OAuth op deze manier gebruiken. Gebruik dit op eigen risico.
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
        veelvoorkomende Windows/npm-indelingen.
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

    De Gemini API-model-id van Gemini 3.1 Pro is `gemini-3.1-pro-preview`. OpenClaw accepteert de kortere `google/gemini-3.1-pro` als handige alias en normaliseert die vóór provider-aanroepen.

    **Omgevingsvariabelen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Of de `GEMINI_CLI_*`-varianten.)

    <Note>
    Als Gemini CLI OAuth-aanvragen mislukken na het inloggen, stel dan `GOOGLE_CLOUD_PROJECT` of
    `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host en probeer het opnieuw.
    </Note>

    <Note>
    Als inloggen mislukt voordat de browserflow begint, controleer dan of de lokale opdracht `gemini`
    is geïnstalleerd en op `PATH` staat.
    </Note>

    `google-gemini-cli/*`-modelverwijzingen zijn verouderde compatibiliteitsaliassen. Nieuwe
    configuraties moeten `google/*`-modelverwijzingen plus de runtime `google-gemini-cli`
    gebruiken wanneer ze lokale Gemini CLI-uitvoering willen.

  </Tab>
</Tabs>

## Mogelijkheden

| Mogelijkheid           | Ondersteund                  |
| ---------------------- | ---------------------------- |
| Chatvoltooiingen       | Ja                           |
| Afbeeldingsgeneratie   | Ja                           |
| Muziekgeneratie        | Ja                           |
| Tekst-naar-spraak      | Ja                           |
| Realtime spraak        | Ja (Google Live API)         |
| Afbeeldingsbegrip      | Ja                           |
| Audiotranscriptie      | Ja                           |
| Videobegrip            | Ja                           |
| Webzoekopdracht (Grounding) | Ja                      |
| Denken/redeneren       | Ja (Gemini 2.5+ / Gemini 3+) |
| Gemma 4-modellen       | Ja                           |

## Webzoekopdracht

De meegeleverde `gemini`-provider voor webzoekopdrachten gebruikt Gemini Google Search-grounding.
Configureer een specifieke zoeksleutel onder `plugins.entries.google.config.webSearch`,
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

De volgorde van credentialvoorrang is de specifieke `webSearch.apiKey`, daarna `GEMINI_API_KEY`,
daarna `models.providers.google.apiKey`. `webSearch.baseUrl` is optioneel en
bestaat voor operatorproxies of compatibele Gemini API-eindpunten; wanneer dit wordt weggelaten,
hergebruikt Gemini-webzoekopdracht `models.providers.google.baseUrl`. Zie
[Gemini-zoekopdracht](/nl/tools/gemini-search) voor het providerspecifieke toolgedrag.

<Tip>
Gemini 3-modellen gebruiken `thinkingLevel` in plaats van `thinkingBudget`. OpenClaw wijst
redeneerinstellingen voor Gemini 3, Gemini 3.1 en `gemini-*-latest`-aliassen toe aan
`thinkingLevel`, zodat standaardruns en runs met lage latentie geen uitgeschakelde
`thinkingBudget`-waarden verzenden.

`/think adaptive` behoudt de dynamische denksemantiek van Google in plaats van
een vast OpenClaw-niveau te kiezen. Gemini 3 en Gemini 3.1 laten een vaste `thinkingLevel` weg zodat
Google het niveau kan kiezen; Gemini 2.5 verzendt de dynamische sentinel van Google
`thinkingBudget: -1`.

Gemma 4-modellen (bijvoorbeeld `gemma-4-26b-a4b-it`) ondersteunen denkmodus. OpenClaw
herschrijft `thinkingBudget` naar een ondersteund Google-`thinkingLevel` voor Gemma 4.
Door denken op `off` te zetten blijft denken uitgeschakeld in plaats van te worden toegewezen aan
`MINIMAL`.
</Tip>

## Afbeeldingsgeneratie

De meegeleverde `google`-provider voor afbeeldingsgeneratie gebruikt standaard
`google/gemini-3.1-flash-image-preview`.

- Ondersteunt ook `google/gemini-3-pro-image-preview`
- Genereren: maximaal 4 afbeeldingen per aanvraag
- Bewerkingsmodus: ingeschakeld, maximaal 5 invoerafbeeldingen
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
Zie [Afbeeldingsgeneratie](/nl/tools/image-generation) voor gedeelde toolparameters, providerselectie en failovergedrag.
</Note>

## Videogeneratie

De meegeleverde `google`-Plugin registreert ook videogeneratie via de gedeelde
tool `video_generate`.

- Standaardvideomodel: `google/veo-3.1-fast-generate-preview`
- Modi: tekst-naar-video, afbeelding-naar-video en flows met één videoreferentie
- Ondersteunt `aspectRatio` (`16:9`, `9:16`) en `resolution` (`720P`, `1080P`); audio-uitvoer wordt vandaag niet ondersteund door Veo
- Ondersteunde duurwaarden: **4, 6 of 8 seconden** (andere waarden worden afgerond naar de dichtstbijzijnde toegestane waarde)

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
tool `music_generate`.

- Standaardmuziekmodel: `google/lyria-3-clip-preview`
- Ondersteunt ook `google/lyria-3-pro-preview`
- Promptinstellingen: `lyrics` en `instrumental`
- Uitvoerformaat: standaard `mp3`, plus `wav` op `google/lyria-3-pro-preview`
- Referentie-invoer: maximaal 10 afbeeldingen
- Runs met sessieondersteuning worden losgekoppeld via de gedeelde taak-/statusflow, inclusief `action: "status"`

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
- Uitvoer: WAV voor normale TTS-bijlagen, Opus voor spraaknotitiedoelen, PCM voor Talk/telefonie
- Spraaknotitie-uitvoer: Google PCM wordt verpakt als WAV en getranscodeerd naar 48 kHz Opus met `ffmpeg`

Het Gemini TTS-batchpad van Google retourneert gegenereerde audio in de voltooide
`generateContent`-respons. Gebruik voor gesproken gesprekken met de laagste latentie de
Google-provider voor realtime spraak, ondersteund door de Gemini Live API, in plaats van batch-
TTS.

Google als standaardprovider voor TTS gebruiken:

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
`audioProfile` in om een herbruikbare stijlprompt vóór de gesproken tekst te plaatsen. Stel
`speakerName` in wanneer je prompttekst naar een benoemde spreker verwijst.

Gemini API TTS accepteert ook expressieve audiotags tussen vierkante haken in de tekst,
zoals `[whispers]` of `[laughs]`. Plaats ze in een `[[tts:text]]...[[/tts:text]]`-
blok om tags uit het zichtbare chatantwoord te houden terwijl ze naar TTS worden verzonden:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Een Google Cloud Console API-sleutel die is beperkt tot de Gemini API is geldig voor deze
provider. Dit is niet het aparte Cloud Text-to-Speech API-pad.
</Note>

## Realtime spraak

De meegeleverde `google`-Plugin registreert een provider voor realtime spraak, ondersteund door de
Gemini Live API voor backend-audiobruggen zoals Voice Call en Google Meet.

| Instelling                          | Configuratiepad                                                    | Standaard                                                                             |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Stem                                | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatuur                         | `...google.temperature`                                             | (niet ingesteld)                                                                      |
| VAD-startgevoeligheid               | `...google.startSensitivity`                                        | (niet ingesteld)                                                                      |
| VAD-eindgevoeligheid                | `...google.endSensitivity`                                          | (niet ingesteld)                                                                      |
| Stilteduur                          | `...google.silenceDurationMs`                                       | (niet ingesteld)                                                                      |
| Activiteitsafhandeling              | `...google.activityHandling`                                        | Google-standaard, `start-of-activity-interrupts`                                      |
| Beurtdekking                        | `...google.turnCoverage`                                            | Google-standaard, `only-activity`                                                     |
| Automatische VAD uitschakelen       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Sessiehervatting                    | `...google.sessionResumption`                                       | `true`                                                                                |
| Contextcompressie                   | `...google.contextWindowCompression`                                | `true`                                                                                |
| API-sleutel                         | `...google.apiKey`                                                  | Valt terug op `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY` |

Voorbeeld van realtimeconfiguratie voor Voice Call:

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
OpenClaw past audio van telefonie-/Meet-bridges aan naar Gemini's PCM Live API-stream en
houdt toolaanroepen op het gedeelde realtime-spraakcontract. Laat `temperature`
niet ingesteld tenzij je samplingwijzigingen nodig hebt; OpenClaw laat niet-positieve waarden weg
omdat Google Live transcripties zonder audio kan retourneren voor `temperature: 0`.
Gemini API-transcriptie is ingeschakeld zonder `languageCodes`; de huidige Google
SDK wijst taalcodehints op dit API-pad af.
</Note>

<Note>
Control UI Talk ondersteunt Google Live-browsersessies met beperkte tokens voor eenmalig gebruik.
Backend-only realtime-spraakproviders kunnen ook via het generieke
Gateway-relaytransport draaien, waarbij providerreferenties op de Gateway blijven.
</Note>

Voor live-verificatie door maintainers, voer uit:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
De smoke dekt ook OpenAI-backend-/WebRTC-paden; de Google-stap maakt dezelfde
beperkte Live API-tokenvorm aan die door Control UI Talk wordt gebruikt, opent het browser-
WebSocket-eindpunt, verstuurt de initiële setup-payload en wacht op
`setupComplete`.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Direct Gemini-cachehergebruik">
    Voor directe Gemini API-runs (`api: "google-generative-ai"`) geeft OpenClaw
    een geconfigureerde `cachedContent`-handle door aan Gemini-verzoeken.

    - Configureer per-model- of globale parameters met
      `cachedContent` of de oudere `cached_content`
    - Als beide aanwezig zijn, wint `cachedContent`
    - Voorbeeldwaarde: `cachedContents/prebuilt-context`
    - Gemini-cache-hitgebruik wordt genormaliseerd naar OpenClaw `cacheRead` vanuit
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
    Bij gebruik van de OAuth-provider `google-gemini-cli` normaliseert OpenClaw
    de CLI JSON-uitvoer als volgt:

    - Antwoordtekst komt uit het CLI JSON-veld `response`.
    - Gebruik valt terug op `stats` wanneer de CLI `usage` leeg laat.
    - `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
    - Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Omgeving en daemoninstelling">
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
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Video genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor muziektools en providerselectie.
  </Card>
</CardGroup>
