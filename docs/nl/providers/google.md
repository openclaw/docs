---
read_when:
    - Je wilt Google Gemini-modellen gebruiken met OpenClaw
    - Je hebt de API-sleutel of de OAuth-authenticatiestroom nodig
summary: Google Gemini instellen (API-sleutel + OAuth, afbeeldingen genereren, media begrijpen, TTS, zoeken op het web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T16:27:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

De Google-plugin biedt toegang tot Gemini-modellen via Google AI Studio, plus afbeeldingsgeneratie, mediabegrip (afbeelding/audio/video), tekst-naar-spraak en zoeken op het web via Gemini Grounding.

- Provider: `google`
- Authenticatie: `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime-optie: `agentRuntime.id: "google-gemini-cli"` hergebruikt Gemini CLI OAuth, terwijl modelverwijzingen canoniek blijven als `google/*`.

## Aan de slag

Kies de gewenste authenticatiemethode en volg de configuratiestappen.

<Tabs>
  <Tab title="API-sleutel">
    **Het meest geschikt voor:** standaardtoegang tot de Gemini API via Google AI Studio.

    <Steps>
      <Step title="Een API-sleutel verkrijgen">
        Maak een gratis sleutel aan in [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Of geef de sleutel rechtstreeks door:

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
    `GEMINI_API_KEY` en `GOOGLE_API_KEY` worden beide geaccepteerd. Gebruik degene die je al hebt geconfigureerd.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Het meest geschikt voor:** aanmelden met je Google-account via Gemini CLI OAuth in plaats van een afzonderlijke API-sleutel te gebruiken.

    <Warning>
    De provider `google-gemini-cli` is een niet-officiële integratie. Sommige gebruikers
    melden accountbeperkingen wanneer OAuth op deze manier wordt gebruikt. Gebruik dit op eigen risico.
    </Warning>

    <Steps>
      <Step title="De Gemini CLI installeren">
        De lokale opdracht `gemini` moet beschikbaar zijn in `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # of npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw ondersteunt zowel installaties via Homebrew als globale npm-installaties, inclusief
        gangbare Windows/npm-indelingen.
      </Step>
      <Step title="Aanmelden via OAuth">
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

    De model-id van Gemini 3.1 Pro voor de Gemini API is `gemini-3.1-pro-preview`. OpenClaw accepteert voor het gemak de kortere `google/gemini-3.1-pro` als alias en normaliseert deze vóór provideraanroepen.

    **Omgevingsvariabelen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Als Gemini CLI OAuth-verzoeken na het aanmelden mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of
    `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host en probeer het opnieuw.
    </Note>

    <Note>
    Als het aanmelden mislukt voordat de browserstroom begint, controleer dan of de lokale opdracht `gemini`
    is geïnstalleerd en in `PATH` staat.
    </Note>

    De automatische detectie tijdens de onboarding vermeldt een bestaande Gemini CLI-aanmelding, maar
    test deze nooit automatisch omdat Gemini CLI geen test zonder tools heeft. Kies Gemini CLI
    OAuth of een Gemini API-sleutel om door te gaan.

    Modelverwijzingen met `google-gemini-cli/*` zijn verouderde compatibiliteitsaliassen. Nieuwe
    configuraties moeten modelverwijzingen met `google/*` plus de runtime `google-gemini-cli`
    gebruiken wanneer lokale uitvoering via Gemini CLI gewenst is.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` is op 2026-03-09 buiten gebruik gesteld; gebruik in plaats daarvan `google/gemini-3.1-pro-preview`. Als je de configuratie van de Gemini API-sleutel opnieuw uitvoert (`openclaw onboard --auth-choice gemini-api-key` of `openclaw models auth login --provider google`), wordt een verouderd geconfigureerd standaardmodel vervangen door het huidige model.
</Note>

## Mogelijkheden

| Mogelijkheid                     | Ondersteund                    |
| -------------------------------- | ------------------------------ |
| Chatvoltooiingen                 | Ja                             |
| Afbeeldingsgeneratie             | Ja                             |
| Muziekgeneratie                  | Ja                             |
| Tekst-naar-spraak                | Ja                             |
| Realtime spraak                  | Ja (Google Live API)           |
| Afbeeldingsbegrip                | Ja                             |
| Audiotranscriptie                | Ja                             |
| Videobegrip                      | Ja                             |
| Zoeken op het web (Grounding)    | Ja                             |
| Denken/redeneren                 | Ja (Gemini 2.5+ / Gemini 3+)   |
| Gemma 4-modellen                 | Ja                             |

## Zoeken op het web

De meegeleverde provider `gemini` voor zoeken op het web gebruikt Gemini Google Search Grounding.
Configureer een speciale zoeksleutel onder `plugins.entries.google.config.webSearch`,
of laat deze `models.providers.google.apiKey` hergebruiken na `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optioneel als GEMINI_API_KEY of models.providers.google.apiKey is ingesteld
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // valt terug op models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

De prioriteit van aanmeldgegevens is eerst de speciale `webSearch.apiKey`, daarna `GEMINI_API_KEY`
en vervolgens `models.providers.google.apiKey`. `webSearch.baseUrl` is optioneel en
bestaat voor operatorproxy's of compatibele Gemini API-eindpunten; wanneer dit wordt weggelaten,
hergebruikt Gemini-zoeken op het web `models.providers.google.baseUrl`. Zie
[Gemini-zoeken](/nl/tools/gemini-search) voor het providerspecifieke gedrag van de tool.

<Tip>
Gemini 3-modellen gebruiken `thinkingLevel` in plaats van `thinkingBudget`. OpenClaw wijst
de besturingselementen voor redeneren van Gemini 3, Gemini 3.1 en de alias `gemini-*-latest` toe aan
`thinkingLevel`, zodat standaarduitvoeringen en uitvoeringen met lage latentie geen uitgeschakelde
`thinkingBudget`-waarden verzenden.

`/think adaptive` behoudt de dynamische denksemantiek van Google in plaats van
een vast OpenClaw-niveau te kiezen. Gemini 3 en Gemini 3.1 laten een vaste `thinkingLevel` weg, zodat
Google het niveau kan kiezen; Gemini 2.5 verzendt de dynamische sentinelwaarde
`thinkingBudget: -1` van Google.

Gemma 4-modellen (bijvoorbeeld `gemma-4-26b-a4b-it`) ondersteunen de denkmodus. OpenClaw
herschrijft `thinkingBudget` naar een ondersteunde Google-`thinkingLevel` voor Gemma 4.
Als denken wordt ingesteld op `off`, blijft denken uitgeschakeld in plaats van dat dit wordt toegewezen aan
`MINIMAL`.

Gemini 2.5 Pro werkt alleen in de denkmodus en weigert een expliciete
`thinkingBudget: 0`; OpenClaw verwijdert die waarde uit verzoeken voor Gemini 2.5 Pro
in plaats van deze te verzenden.
</Tip>

## Afbeeldingsgeneratie

De meegeleverde provider `google` voor afbeeldingsgeneratie gebruikt standaard
`google/gemini-3.1-flash-image-preview`.

- Ondersteunt ook `google/gemini-3-pro-image-preview`
- Genereren: maximaal 4 afbeeldingen per verzoek
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

De meegeleverde Plugin `google` registreert ook videogeneratie via de gedeelde
tool `video_generate`.

- Standaardvideomodel: `google/veo-3.1-fast-generate-preview`
- Modi: tekst-naar-video, afbeelding-naar-video en stromen met één video als referentie
- Ondersteunt `aspectRatio` (`16:9`, `9:16`) en `resolution` (`720P`, `1080P`); audio-uitvoer wordt momenteel niet ondersteund door Veo
- Ondersteunde tijdsduren: **4, 6 of 8 seconden** (andere waarden worden afgerond naar de dichtstbijzijnde toegestane waarde)

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

De meegeleverde Plugin `google` registreert ook muziekgeneratie via de gedeelde
tool `music_generate`.

- Standaardmuziekmodel: `google/lyria-3-clip-preview`
- Ondersteunt ook `google/lyria-3-pro-preview`
- Promptinstellingen: `lyrics` en `instrumental`
- Uitvoerformaat: standaard `mp3`, plus `wav` op `google/lyria-3-pro-preview`
- Referentie-invoer: maximaal 10 afbeeldingen
- Uitvoeringen met een sessie worden losgekoppeld via de gedeelde taak-/statusstroom, inclusief `action: "status"`

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

De meegeleverde spraakprovider `google` gebruikt het TTS-pad van de Gemini API met
`gemini-3.1-flash-tts-preview`.

- Standaardstem: `Kore`
- Authenticatie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- Uitvoer: WAV voor gewone TTS-bijlagen, Opus voor doelen voor spraaknotities, PCM voor Talk/telefonie
- Uitvoer voor spraaknotities: Google PCM wordt verpakt als WAV en met `ffmpeg` getranscodeerd naar Opus van 48 kHz

Het batchpad voor Gemini TTS van Google retourneert de gegenereerde audio in het voltooide
`generateContent`-antwoord. Gebruik voor gesproken gesprekken met de laagste latentie de
realtime spraakprovider van Google die wordt ondersteund door de Gemini Live API, in plaats van batch-
TTS.

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
          speakerVoice: "Kore",
          audioProfile: "Spreek professioneel met een kalme toon.",
        },
      },
    },
  },
}
```

Gemini API TTS gebruikt prompts in natuurlijke taal voor stijlbesturing. Stel
`audioProfile` in om vóór de gesproken tekst een herbruikbare stijlprompt toe te voegen. Stel
`speakerName` in wanneer je prompttekst naar een bij naam genoemde spreker verwijst.

Gemini API TTS accepteert in de tekst ook expressieve audiotags tussen vierkante haken,
zoals `[whispers]` of `[laughs]`. Om tags buiten het zichtbare chatantwoord te houden
terwijl ze wel naar TTS worden verzonden, plaats je ze in een `[[tts:text]]...[[/tts:text]]`-
blok:

```text
Hier staat de gewone antwoordtekst.

[[tts:text]][whispers] Hier staat de gesproken versie.[[/tts:text]]
```

<Note>
Een API-sleutel uit Google Cloud Console die beperkt is tot de Gemini API is geldig voor deze
provider. Dit is niet het afzonderlijke API-pad van Cloud Text-to-Speech.
</Note>

## Realtime spraak

De meegeleverde Plugin `google` registreert een realtime spraakprovider die wordt ondersteund door de
Gemini Live API voor audioverbindingen aan de backend, zoals Voice Call en Google Meet.

| Instelling            | Configuratiepad                                                     | Standaardwaarde                                                                        |
| --------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                        |
| Stem                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatuur           | `...google.temperature`                                             | (niet ingesteld)                                                                       |
| VAD-startgevoeligheid | `...google.startSensitivity`                                        | (niet ingesteld)                                                                       |
| VAD-eindgevoeligheid  | `...google.endSensitivity`                                          | (niet ingesteld)                                                                       |
| Stilteduur            | `...google.silenceDurationMs`                                       | (niet ingesteld)                                                                       |
| Activiteitsafhandeling | `...google.activityHandling`                                        | Google-standaard, `start-of-activity-interrupts`                                        |
| Beurtdekking          | `...google.turnCoverage`                                            | Google-standaard, `audio-activity-and-all-video`                                        |
| Automatische VAD uitschakelen | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Sessie hervatten      | `...google.sessionResumption`                                       | `true`                                                                                |
| Contextcompressie     | `...google.contextWindowCompression`                                | `true`                                                                                |
| API-sleutel           | `...google.apiKey`                                                  | Valt terug op `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY` |

Voorbeeld van een realtimeconfiguratie voor Voice Call:

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
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
OpenClaw past audio van de telefonie-/Meet-bridge aan de PCM Live API-stream van Gemini aan en
houdt toolaanroepen binnen het gedeelde realtime-spraakcontract. Laat `temperature`
niet ingesteld, tenzij je de sampling wilt wijzigen; OpenClaw laat niet-positieve waarden weg,
omdat Google Live voor `temperature: 0` transcripties zonder audio kan retourneren.
Transcriptie via de Gemini API is ingeschakeld zonder `languageCodes`; de huidige Google
SDK weigert hints voor taalcodes op dit API-pad.
</Note>

<Note>
Gemini 3.1 Live accepteert gesprekstekst via realtime-invoer en gebruikt
opeenvolgende functieaanroepen. OpenClaw laat voor dit model de oudere
`NON_BLOCKING`, planning van functieresponsen en velden voor affectieve dialogen weg. Geef de voorkeur
aan `thinkingLevel`; geconfigureerde positieve waarden voor `thinkingBudget` worden toegewezen aan het
dichtstbijzijnde ondersteunde niveau, terwijl `-1` de standaardwaarde van Google behoudt. Zie de
[vergelijking van Gemini Live-mogelijkheden](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Control UI Talk ondersteunt Google Live-browsersessies met beperkte tokens voor eenmalig gebruik.
Realtime-spraakproviders die alleen via de backend werken, kunnen ook via het generieke
Gateway-relaytransport worden uitgevoerd, waarbij de providerreferenties op de Gateway blijven.
</Note>

Voer voor liveverificatie door beheerders
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` uit.
De rooktest omvat ook de OpenAI-backend-/WebRTC-paden; het Google-deel maakt hetzelfde
beperkte Live API-tokenformaat aan dat Control UI Talk gebruikt, opent het
WebSocket-eindpunt van de browser, verzendt de initiële installatiepayload en wacht op
`setupComplete`.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Direct hergebruik van de Gemini-cache">
    Voor rechtstreekse Gemini API-uitvoeringen (`api: "google-generative-ai"`) geeft OpenClaw
    een geconfigureerde `cachedContent`-handle door aan Gemini-verzoeken.

    - Configureer parameters per model of globaal met
      `cachedContent` of de verouderde `cached_content`
    - Parameters uit een specifiekere scope (modelniveau boven globaal) hebben altijd voorrang.
      Als binnen dezelfde scope beide sleutels zijn ingesteld, heeft `cached_content` voorrang.
      Gebruik slechts één sleutel per scope om verrassingen te voorkomen.
    - Voorbeeldwaarde: `cachedContents/prebuilt-context`
    - Gebruik bij een Gemini-cachetreffer wordt genormaliseerd naar OpenClaw `cacheRead` vanuit
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

  <Accordion title="Gebruiksopmerkingen voor Gemini CLI">
    Bij gebruik van de OAuth-provider `google-gemini-cli` gebruikt OpenClaw standaard
    uitvoer van Gemini CLI `stream-json` en normaliseert het gebruik uit de uiteindelijke
    `stats`-payload. Verouderde `--output-format json`-overschrijvingen gebruiken nog steeds de
    JSON-parser.

    - Gestreamde antwoordtekst is afkomstig van `message`-gebeurtenissen van de assistent.
    - Bij verouderde JSON-uitvoer is de antwoordtekst afkomstig uit het CLI JSON-veld `response`.
    - Het gebruik valt terug op `stats` wanneer de CLI `usage` leeg laat.
    - `stats.cached` wordt genormaliseerd naar OpenClaw `cacheRead`.
    - Als `stats.input` ontbreekt, leidt OpenClaw invoertokens af uit
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Omgevings- en daemonconfiguratie">
    Als de Gateway als daemon (launchd/systemd) wordt uitgevoerd, zorg er dan voor dat `GEMINI_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor afbeeldingstools en providerselectie.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor videotools en providerselectie.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor muziektools en providerselectie.
  </Card>
</CardGroup>
