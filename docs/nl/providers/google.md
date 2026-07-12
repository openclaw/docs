---
read_when:
    - Je wilt Google Gemini-modellen gebruiken met OpenClaw
    - Je hebt de API-sleutel of de OAuth-authenticatiestroom nodig
summary: Google Gemini instellen (API-sleutel + OAuth, afbeeldingen genereren, mediabegrip, TTS, zoeken op het web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T09:18:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

De Google-plugin biedt toegang tot Gemini-modellen via Google AI Studio, plus beeldgeneratie, mediabegrip (beeld/audio/video), tekst-naar-spraak en zoeken op het web via Gemini Grounding.

- Provider: `google`
- Authenticatie: `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime-optie: `agentRuntime.id: "google-gemini-cli"` hergebruikt Gemini CLI OAuth en behoudt daarbij canonieke modelverwijzingen als `google/*`.

## Aan de slag

Kies de authenticatiemethode van uw voorkeur en volg de configuratiestappen.

<Tabs>
  <Tab title="API-sleutel">
    **Het meest geschikt voor:** standaardtoegang tot de Gemini API via Google AI Studio.

    <Steps>
      <Step title="Voer de onboarding uit">
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
      <Step title="Stel een standaardmodel in">
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
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Zowel `GEMINI_API_KEY` als `GOOGLE_API_KEY` wordt geaccepteerd. Gebruik de variabele die u al hebt geconfigureerd.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Het meest geschikt voor:** het hergebruiken van een bestaande Gemini CLI-aanmelding via PKCE OAuth in plaats van een afzonderlijke API-sleutel.

    <Warning>
    De provider `google-gemini-cli` is een onofficiële integratie. Sommige gebruikers
    melden accountbeperkingen wanneer OAuth op deze manier wordt gebruikt. Gebruik dit op eigen risico.
    </Warning>

    <Steps>
      <Step title="Installeer de Gemini CLI">
        De lokale opdracht `gemini` moet beschikbaar zijn op `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # of npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw ondersteunt zowel Homebrew-installaties als globale npm-installaties, inclusief
        gangbare Windows/npm-indelingen.
      </Step>
      <Step title="Meld u aan via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Standaardmodel: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    De Gemini API-model-id van Gemini 3.1 Pro is `gemini-3.1-pro-preview`. OpenClaw accepteert de kortere vorm `google/gemini-3.1-pro` als handige alias en normaliseert deze vóór provideraanroepen.

    **Omgevingsvariabelen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Als Gemini CLI OAuth-verzoeken na het aanmelden mislukken, stelt u `GOOGLE_CLOUD_PROJECT` of
    `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host en probeert u het opnieuw.
    </Note>

    <Note>
    Als het aanmelden mislukt voordat de browserprocedure begint, controleert u of de lokale opdracht `gemini`
    is geïnstalleerd en op `PATH` staat.
    </Note>

    Modelverwijzingen van het type `google-gemini-cli/*` zijn verouderde compatibiliteitsaliassen. Nieuwe
    configuraties moeten modelverwijzingen van het type `google/*` plus de runtime `google-gemini-cli`
    gebruiken wanneer lokale uitvoering via Gemini CLI gewenst is.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` is op 2026-03-09 buiten gebruik gesteld; gebruik in plaats daarvan `google/gemini-3.1-pro-preview`. Wanneer u de configuratie van de Gemini API-sleutel opnieuw uitvoert (`openclaw onboard --auth-choice gemini-api-key` of `openclaw models auth login --provider google`), wordt een verouderd geconfigureerd standaardmodel herschreven naar het huidige model.
</Note>

## Mogelijkheden

| Mogelijkheid                     | Ondersteund                     |
| -------------------------------- | ------------------------------- |
| Chataanvullingen                  | Ja                              |
| Beeldgeneratie                    | Ja                              |
| Muziekgeneratie                   | Ja                              |
| Tekst-naar-spraak                 | Ja                              |
| Realtime spraak                   | Ja (Google Live API)            |
| Beeldbegrip                       | Ja                              |
| Audiotranscriptie                 | Ja                              |
| Videobegrip                       | Ja                              |
| Zoeken op het web (Grounding)     | Ja                              |
| Denken/redeneren                  | Ja (Gemini 2.5+ / Gemini 3+)    |
| Gemma 4-modellen                  | Ja                              |

## Zoeken op het web

De meegeleverde `gemini`-provider voor zoeken op het web gebruikt grounding via Google Search van Gemini.
Configureer een afzonderlijke zoeksleutel onder `plugins.entries.google.config.webSearch`,
of laat deze na `GEMINI_API_KEY` de waarde van `models.providers.google.apiKey` hergebruiken:

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

De prioriteitsvolgorde voor aanmeldgegevens is de specifieke `webSearch.apiKey`, vervolgens `GEMINI_API_KEY`
en daarna `models.providers.google.apiKey`. `webSearch.baseUrl` is optioneel en
is bedoeld voor operatorproxy's of compatibele Gemini API-eindpunten; wanneer deze waarde wordt weggelaten,
hergebruikt zoeken op het web met Gemini `models.providers.google.baseUrl`. Zie
[Zoeken met Gemini](/nl/tools/gemini-search) voor het providerspecifieke gedrag van de tool.

<Tip>
Gemini 3-modellen gebruiken `thinkingLevel` in plaats van `thinkingBudget`. OpenClaw koppelt
de besturingselementen voor redeneren van Gemini 3, Gemini 3.1 en de alias `gemini-*-latest` aan
`thinkingLevel`, zodat standaarduitvoeringen en uitvoeringen met lage latentie geen uitgeschakelde
`thinkingBudget`-waarden verzenden.

`/think adaptive` behoudt de dynamische denksemantiek van Google in plaats van
een vast OpenClaw-niveau te kiezen. Gemini 3 en Gemini 3.1 laten een vast `thinkingLevel` weg, zodat
Google het niveau kan kiezen; Gemini 2.5 verzendt de dynamische sentinelwaarde van Google
`thinkingBudget: -1`.

Gemma 4-modellen (bijvoorbeeld `gemma-4-26b-a4b-it`) ondersteunen de denkmodus. OpenClaw
herschrijft `thinkingBudget` naar een ondersteund `thinkingLevel` van Google voor Gemma 4.
Wanneer denken wordt ingesteld op `off`, blijft denken uitgeschakeld in plaats van dat het wordt
gekoppeld aan `MINIMAL`.

Gemini 2.5 Pro werkt alleen in de denkmodus en weigert een expliciete waarde
`thinkingBudget: 0`; OpenClaw verwijdert die waarde uit verzoeken voor Gemini 2.5 Pro
in plaats van deze te verzenden.
</Tip>

## Beeldgeneratie

De meegeleverde `google`-provider voor beeldgeneratie gebruikt standaard
`google/gemini-3.1-flash-image-preview`.

- Ondersteunt ook `google/gemini-3-pro-image-preview`
- Genereren: maximaal 4 beelden per verzoek
- Bewerkingsmodus: ingeschakeld, maximaal 5 invoerbeelden
- Geometrie-instellingen: `size`, `aspectRatio` en `resolution`

Google als standaardprovider voor beelden gebruiken:

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

De meegeleverde `google`-plugin registreert ook videogeneratie via de gedeelde
tool `video_generate`.

- Standaardvideomodel: `google/veo-3.1-fast-generate-preview`
- Modi: tekst-naar-video, beeld-naar-video en procedures met één video als referentie
- Ondersteunt `aspectRatio` (`16:9`, `9:16`) en `resolution` (`720P`, `1080P`); audio-uitvoer wordt momenteel niet ondersteund door Veo
- Ondersteunde tijdsduren: **4, 6 of 8 seconden** (andere waarden worden aangepast naar de dichtstbijzijnde toegestane waarde)

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

De meegeleverde `google`-plugin registreert ook muziekgeneratie via de gedeelde
tool `music_generate`.

- Standaardmuziekmodel: `google/lyria-3-clip-preview`
- Ondersteunt ook `google/lyria-3-pro-preview`
- Promptinstellingen: `lyrics` en `instrumental`
- Uitvoerindeling: standaard `mp3`, plus `wav` bij `google/lyria-3-pro-preview`
- Referentie-invoer: maximaal 10 beelden
- Uitvoeringen met een sessie worden losgekoppeld via de gedeelde taak-/statusprocedure, inclusief `action: "status"`

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

De meegeleverde `google`-spraakprovider gebruikt het TTS-pad van de Gemini API met
`gemini-3.1-flash-tts-preview`.

- Standaardstem: `Kore`
- Authenticatie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY`
- Uitvoer: WAV voor gewone TTS-bijlagen, Opus voor doelen met spraaknotities en PCM voor Talk/telefonie
- Uitvoer als spraaknotitie: Google PCM wordt verpakt als WAV en met `ffmpeg` getranscodeerd naar Opus van 48 kHz

Het batchpad van Gemini TTS van Google retourneert gegenereerde audio in het voltooide
`generateContent`-antwoord. Gebruik voor gesproken gesprekken met de laagste latentie de
realtime spraakprovider van Google die wordt ondersteund door de Gemini Live API, in plaats van batch-TTS.

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
          audioProfile: "Spreek professioneel met een rustige toon.",
        },
      },
    },
  },
}
```

Gemini API TTS gebruikt prompts in natuurlijke taal voor stijlbesturing. Stel
`audioProfile` in om vóór de gesproken tekst een herbruikbare stijlprompt toe te voegen. Stel
`speakerName` in wanneer uw prompttekst naar een spreker met een naam verwijst.

Gemini API TTS accepteert ook expressieve audiotags tussen vierkante haken in de tekst,
zoals `[whispers]` of `[laughs]`. Als u wilt voorkomen dat tags in het zichtbare chatantwoord worden weergegeven
terwijl ze wel naar TTS worden verzonden, plaatst u ze in een blok `[[tts:text]]...[[/tts:text]]`:

```text
Hier staat de nette antwoordtekst.

[[tts:text]][whispers] Hier staat de gesproken versie.[[/tts:text]]
```

<Note>
Een API-sleutel van Google Cloud Console die is beperkt tot de Gemini API is geldig voor deze
provider. Dit is niet het afzonderlijke API-pad van Cloud Text-to-Speech.
</Note>

## Realtime spraak

De meegeleverde `google`-plugin registreert een realtime spraakprovider die wordt ondersteund door de
Gemini Live API voor audioverbindingen aan de backend, zoals Voice Call en Google Meet.

| Instelling                  | Configuratiepad                                                     | Standaardwaarde                                                                        |
| --------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Model                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                        |
| Stem                        | `...google.voice`                                                   | `Kore`                                                                                 |
| Temperatuur                 | `...google.temperature`                                             | (niet ingesteld)                                                                       |
| VAD-startgevoeligheid       | `...google.startSensitivity`                                        | (niet ingesteld)                                                                       |
| VAD-eindgevoeligheid        | `...google.endSensitivity`                                          | (niet ingesteld)                                                                       |
| Stilteduur                  | `...google.silenceDurationMs`                                       | (niet ingesteld)                                                                       |
| Activiteitsafhandeling      | `...google.activityHandling`                                        | Google-standaard, `start-of-activity-interrupts`                                       |
| Beurtdekking                | `...google.turnCoverage`                                            | Google-standaard, `audio-activity-and-all-video`                                       |
| Automatische VAD uitschakelen | `...google.automaticActivityDetectionDisabled`                    | `false`                                                                                |
| Sessiehervatting            | `...google.sessionResumption`                                       | `true`                                                                                 |
| Contextcompressie           | `...google.contextWindowCompression`                                | `true`                                                                                 |
| API-sleutel                 | `...google.apiKey`                                                  | Valt terug op `models.providers.google.apiKey`, `GEMINI_API_KEY` of `GOOGLE_API_KEY`   |

Voorbeeldconfiguratie voor realtime spraakoproepen:

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
De Google Live API gebruikt bidirectionele audio en functieaanroepen via een WebSocket.
OpenClaw past audio van de telefonie-/Meet-bridge aan de PCM Live API-stream van Gemini aan en
houdt toolaanroepen binnen het gedeelde realtime spraakcontract. Laat `temperature`
niet ingesteld, tenzij u de sampling wilt aanpassen; OpenClaw laat niet-positieve waarden weg
omdat Google Live bij `temperature: 0` transcripties zonder audio kan retourneren.
Gemini API-transcriptie wordt ingeschakeld zonder `languageCodes`; de huidige Google
SDK weigert hints voor taalcodes op dit API-pad.
</Note>

<Note>
Gemini 3.1 Live accepteert gesprekstekst via realtime invoer en gebruikt
opeenvolgende functieaanroepen. OpenClaw laat de oudere velden `NON_BLOCKING`, planning
van functieresponsen en affectieve dialogen weg voor dit model. Gebruik bij voorkeur
`thinkingLevel`; geconfigureerde positieve waarden voor `thinkingBudget` worden toegewezen aan het
dichtstbijzijnde ondersteunde niveau, terwijl `-1` de standaardwaarde van Google behoudt. Zie de
[vergelijking van Gemini Live-mogelijkheden](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk in de Control UI ondersteunt Google Live-browsersessies met beperkte tokens
voor eenmalig gebruik. Realtime spraakproviders die alleen in de backend werken, kunnen ook via het algemene
Gateway-relaytransport worden uitgevoerd, waarbij de providerreferenties op de Gateway blijven.
</Note>

Voer voor live verificatie door beheerders
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` uit.
De rooktest controleert ook de backend-/WebRTC-paden van OpenAI; het Google-onderdeel maakt hetzelfde
beperkte Live API-tokenformaat aan dat door Talk in de Control UI wordt gebruikt, opent het
WebSocket-eindpunt van de browser, verzendt de initiële configuratiegegevens en wacht op
`setupComplete`.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Direct hergebruik van de Gemini-cache">
    Voor directe Gemini API-uitvoeringen (`api: "google-generative-ai"`) geeft OpenClaw
    een geconfigureerde `cachedContent`-verwijzing door aan Gemini-aanvragen.

    - Configureer parameters per model of globaal met
      `cachedContent` of de verouderde sleutel `cached_content`
    - Parameters uit een specifieker bereik (modelniveau boven globaal) hebben altijd voorrang.
      Als binnen hetzelfde bereik beide sleutels zijn ingesteld, heeft `cached_content` voorrang.
      Gebruik slechts één sleutel per bereik om verrassingen te voorkomen.
    - Voorbeeldwaarde: `cachedContents/prebuilt-context`
    - Het cachegebruik bij een treffer in Gemini wordt in OpenClaw genormaliseerd naar `cacheRead` op basis van
      de bovenliggende waarde `cachedContentTokenCount`

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

  <Accordion title="Gebruiksopmerkingen voor de Gemini CLI">
    Bij gebruik van de OAuth-provider `google-gemini-cli` gebruikt OpenClaw standaard de
    `stream-json`-uitvoer van de Gemini CLI en normaliseert het gebruik op basis van de uiteindelijke
    `stats`-gegevens. Verouderde overschrijvingen met `--output-format json` blijven de
    JSON-parser gebruiken.

    - Gestreamde antwoordtekst is afkomstig uit `message`-gebeurtenissen van de assistent.
    - Bij verouderde JSON-uitvoer is de antwoordtekst afkomstig uit het CLI JSON-veld `response`.
    - Voor gebruik wordt teruggevallen op `stats` wanneer de CLI `usage` leeg laat.
    - `stats.cached` wordt in OpenClaw genormaliseerd naar `cacheRead`.
    - Als `stats.input` ontbreekt, leidt OpenClaw het aantal invoertokens af van
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Omgevings- en daemonconfiguratie">
    Als de Gateway als daemon wordt uitgevoerd (launchd/systemd), zorg er dan voor dat `GEMINI_API_KEY`
    beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en gedrag bij uitval kiezen.
  </Card>
  <Card title="Afbeeldingen genereren" href="/nl/tools/image-generation" icon="image">
    Gedeelde parameters voor de afbeeldingstool en providerselectie.
  </Card>
  <Card title="Video's genereren" href="/nl/tools/video-generation" icon="video">
    Gedeelde parameters voor de videotool en providerselectie.
  </Card>
  <Card title="Muziek genereren" href="/nl/tools/music-generation" icon="music">
    Gedeelde parameters voor de muziektool en providerselectie.
  </Card>
</CardGroup>
