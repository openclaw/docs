---
read_when:
    - Tekst-naar-spraak inschakelen voor antwoorden
    - Een TTS-provider, fallbackketen of persona configureren
    - Gebruik van /tts-opdrachten of -instructies
sidebarTitle: Text to speech (TTS)
summary: Tekst-naar-spraak voor uitgaande antwoorden — providers, persona's, slash commands en uitvoer per kanaal
title: Tekst-naar-spraak
x-i18n:
    generated_at: "2026-06-27T18:31:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw kan uitgaande antwoorden omzetten naar audio via **14 spraakproviders**
en native spraakberichten afleveren op Feishu, Matrix, Telegram en WhatsApp,
audio-bijlagen overal elders, en PCM/Ulaw-streams voor telefonie en Talk.

TTS is de spraakuitvoerhelft van Talk's `stt-tts`-modus. Provider-native
`realtime` Talk-sessies synthetiseren spraak binnen de realtime-provider in plaats
van dit TTS-pad aan te roepen, terwijl `transcription`-sessies geen gesproken
assistentantwoord synthetiseren.

## Snel starten

<Steps>
  <Step title="Kies een provider">
    OpenAI en ElevenLabs zijn de betrouwbaarste gehoste opties. Microsoft en
    Local CLI werken zonder API-sleutel. Zie de [providermatrix](#supported-providers)
    voor de volledige lijst.
  </Step>
  <Step title="Stel de API-sleutel in">
    Exporteer de omgevingsvariabele voor je provider (bijvoorbeeld `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft en Local CLI hebben geen sleutel nodig.
  </Step>
  <Step title="Schakel in via configuratie">
    Stel `messages.tts.auto: "always"` en `messages.tts.provider` in:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Probeer het in chat">
    `/tts status` toont de huidige status. `/tts audio Hello from OpenClaw`
    verstuurt een eenmalig audio-antwoord.
  </Step>
</Steps>

<Note>
Auto-TTS staat standaard **uit**. Wanneer `messages.tts.provider` niet is ingesteld,
kiest OpenClaw de eerste geconfigureerde provider in de automatische selectievolgorde
van het register. De ingebouwde `tts`-agenttool is alleen voor expliciete intentie:
gewone chat blijft tekst tenzij de gebruiker om audio vraagt, `/tts` gebruikt, of
Auto-TTS/directieve spraak inschakelt.
</Note>

## Ondersteunde providers

| Provider          | Authenticatie                                                                                                    | Opmerkingen                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (ook `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)           | Native Ogg/Opus-spraaknotitie-uitvoer en telefonie.                                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-compatibele TTS. Standaard `hexgrad/Kokoro-82M`.                                     |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` of `XI_API_KEY`                                                                             | Stemklonen, meertalig, deterministisch via `seed`; gestreamd voor Discord-spraakweergave.   |
| **Google Gemini** | `GEMINI_API_KEY` of `GOOGLE_API_KEY`                                                                             | Gemini API batch-TTS; persona-bewust via `promptTemplate: "audio-profile-v1"`.              |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Spraaknotitie- en telefonie-uitvoer.                                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS-API. Native Opus-spraaknotitie en PCM-telefonie.                              |
| **Local CLI**     | geen                                                                                                             | Voert een geconfigureerde lokale TTS-opdracht uit.                                          |
| **Microsoft**     | geen                                                                                                             | Publieke Edge neural TTS via `node-edge-tts`. Best-effort, geen SLA.                        |
| **MiniMax**       | `MINIMAX_API_KEY` (of Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2-API. Standaard `speech-2.8-hd`.                                                      |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Ook gebruikt voor automatische samenvatting; ondersteunt persona-`instructions`.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kan `models.providers.openrouter.apiKey` hergebruiken)                                     | Standaardmodel `hexgrad/kokoro-82m`.                                                        |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY` (legacy AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP-API.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Gedeelde image-, video- en spraakprovider.                                                  |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch-TTS. Native Opus-spraaknotitie wordt **niet** ondersteund.                        |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS via Xiaomi-chatvoltooiingen.                                                       |

Als meerdere providers zijn geconfigureerd, wordt de geselecteerde eerst gebruikt
en zijn de andere fallbackopties. Automatische samenvatting gebruikt `summaryModel`
(of `agents.defaults.model.primary`), dus die provider moet ook geauthenticeerd zijn
als je samenvattingen ingeschakeld houdt.

<Warning>
De gebundelde **Microsoft**-provider gebruikt Microsoft Edge's online neural TTS-service
via `node-edge-tts`. Dit is een publieke webservice zonder gepubliceerde SLA of quota:
behandel deze als best-effort. De legacy-provider-id `edge` wordt genormaliseerd naar
`microsoft` en `openclaw doctor --fix` herschrijft opgeslagen configuratie; nieuwe
configuraties moeten altijd `microsoft` gebruiken.
</Warning>

## Configuratie

TTS-configuratie staat onder `messages.tts` in `~/.openclaw/openclaw.json`. Kies een
preset en pas het providerblok aan:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          speakerVoice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          speakerVoiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (geen sleutel)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          speakerVoiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          speakerVoice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          speakerVoiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Voor Xiaomi `mimo-v2.5-tts-voicedesign` laat je `speakerVoice` weg en stel je
`style` in op de prompt voor stemontwerp. OpenClaw verstuurt die prompt als het
TTS-`user`-bericht en verstuurt geen `audio.voice` voor het voicedesign-model.

### Spraakoverschrijvingen per agent

Gebruik `agents.list[].tts` wanneer een agent moet spreken met een andere provider,
stem, model, persona of auto-TTS-modus. Het agentblok wordt diep samengevoegd bovenop
`messages.tts`, zodat providerreferenties in de globale providerconfiguratie kunnen blijven staan:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Om een persona per agent vast te zetten, stel je `agents.list[].tts.persona` in naast de providerconfiguratie — dit overschrijft de globale `messages.tts.persona` alleen voor die agent.

Volgorde van prioriteit voor automatische antwoorden, `/tts audio`, `/tts status` en de
agenttool `tts`:

1. `messages.tts`
2. actieve `agents.list[].tts`
3. kanaaloverschrijving, wanneer het kanaal `channels.<channel>.tts` ondersteunt
4. accountoverschrijving, wanneer het kanaal `channels.<channel>.accounts.<id>.tts` doorgeeft
5. lokale `/tts`-voorkeuren voor deze host
6. inline `[[tts:...]]`-directieven wanneer [modeloverschrijvingen](#model-driven-directives) zijn ingeschakeld

Kanaal- en accountoverschrijvingen gebruiken dezelfde vorm als `messages.tts` en
worden diep samengevoegd bovenop de eerdere lagen, zodat gedeelde providerreferenties in
`messages.tts` kunnen blijven staan terwijl een kanaal of botaccount alleen de sprekerstem, het model, de persona
of automatische modus wijzigt:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persona's

Een **persona** is een stabiele gesproken identiteit die deterministisch kan worden toegepast
over providers heen. Deze kan één provider prefereren, providerneutrale promptintentie
definiëren en providerspecifieke koppelingen bevatten voor stemmen, modellen, prompttemplates,
seeds en steminstellingen.

### Minimale persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Volledige persona (providerneutrale prompt)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Persona-resolutie

De actieve persona wordt deterministisch geselecteerd:

1. lokale voorkeur `/tts persona <id>`, indien ingesteld.
2. `messages.tts.persona`, indien ingesteld.
3. Geen persona.

Providerselectie werkt expliciet-eerst:

1. Directe overschrijvingen (CLI, Gateway, Talk, toegestane TTS-directieven).
2. lokale voorkeur `/tts provider <id>`.
3. `provider` van de actieve persona.
4. `messages.tts.provider`.
5. Automatische selectie uit het register.

Voor elke providerpoging voegt OpenClaw configuraties samen in deze volgorde:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrouwde verzoekoverschrijvingen
4. Toegestane door het model uitgegeven TTS-directiefoverschrijvingen

### Hoe providers persona-prompts gebruiken

Persona-promptvelden (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) zijn **providerneutraal**. Elke provider bepaalt zelf hoe
deze worden gebruikt:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Verpakt persona-promptvelden in een Gemini TTS-promptstructuur **alleen wanneer**
    de effectieve Google-providerconfiguratie `promptTemplate: "audio-profile-v1"`
    of `personaPrompt` instelt. De oudere velden `audioProfile` en `speakerName` worden
    nog steeds vooraf ingevoegd als Google-specifieke prompttekst. Inline audiotags zoals
    `[whispers]` of `[laughs]` binnen een `[[tts:text]]`-blok blijven behouden
    binnen het Gemini-transcript; OpenClaw genereert deze tags niet.
  </Accordion>
  <Accordion title="OpenAI">
    Koppelt persona-promptvelden aan het verzoekveld `instructions` **alleen wanneer**
    er geen expliciete OpenAI-`instructions` is geconfigureerd. Expliciete `instructions`
    heeft altijd voorrang.
  </Accordion>
  <Accordion title="Andere providers">
    Gebruiken alleen de providerspecifieke persona-koppelingen onder
    `personas.<id>.providers.<provider>`. Persona-promptvelden worden genegeerd
    tenzij de provider zijn eigen persona-promptkoppeling implementeert.
  </Accordion>
</AccordionGroup>

### Fallbackbeleid

`fallbackPolicy` bepaalt het gedrag wanneer een persona **geen koppeling** heeft voor de
geprobeerde provider:

| Beleid              | Gedrag                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Standaard.** Providerneutrale promptvelden blijven beschikbaar; de provider kan ze gebruiken of negeren.                                            |
| `provider-defaults` | Persona wordt weggelaten uit de promptvoorbereiding voor die poging; de provider gebruikt zijn neutrale standaardwaarden terwijl fallback naar andere providers doorgaat. |
| `fail`              | Sla die providerpoging over met `reasonCode: "not_configured"` en `personaBinding: "missing"`. Fallbackproviders worden nog steeds geprobeerd.              |

Het volledige TTS-verzoek mislukt alleen wanneer **elke** geprobeerde provider wordt overgeslagen
of mislukt.

Providerselectie voor Talk-sessies is sessiegebonden. Een Talk-client moet
provider-id's, model-id's, stem-id's en locales kiezen uit `talk.catalog` en deze
doorgeven via de Talk-sessie of het overdrachtsverzoek. Het openen van een stemsessie mag
`messages.tts` of globale standaardwaarden voor Talk-providers niet wijzigen.

## Modelgestuurde directieven

Standaard **kan** de assistent `[[tts:...]]`-directieven uitsturen om
stem, model of snelheid voor één antwoord te overschrijven, plus een optioneel
`[[tts:text]]...[[/tts:text]]`-blok voor expressieve aanwijzingen die alleen in
audio moeten verschijnen:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Wanneer `messages.tts.auto` `"tagged"` is, zijn **directieven vereist** om
audio te activeren. Streamingbloklevering verwijdert directieven uit zichtbare tekst voordat het
kanaal ze ziet, zelfs wanneer ze over aangrenzende blokken zijn verdeeld.

`provider=...` wordt genegeerd tenzij `modelOverrides.allowProvider: true`. Wanneer een
antwoord `provider=...` declareert, worden de andere sleutels in die directieve
alleen door die provider geparseerd; niet-ondersteunde sleutels worden verwijderd en gerapporteerd als TTS-directiefwaarschuwingen.

**Beschikbare directiefsleutels:**

- `provider` (geregistreerde provider-id; vereist `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (legacy aliassen: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-volume, 0–10)
- `pitch` (MiniMax-geheel getal voor toonhoogte, −12 tot 12; fractionele waarden worden afgekapt)
- `emotion` (Volcengine-emotietag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Schakel modeloverschrijvingen volledig uit:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Sta providerwissels toe terwijl andere knoppen configureerbaar blijven:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slashcommando's

Eén commando `/tts`. Op Discord registreert OpenClaw ook `/voice` omdat
`/tts` een ingebouwd Discord-commando is — tekst `/tts ...` blijft werken.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Commando's vereisen een geautoriseerde afzender (allowlist-/eigenaarregels zijn van toepassing) en ofwel
`commands.text`, of native commandoregistratie moet zijn ingeschakeld.
</Note>

Gedragsnotities:

- `/tts on` schrijft de lokale TTS-voorkeur naar `always`; `/tts off` schrijft deze naar `off`.
- `/tts chat on|off|default` schrijft een sessiegebonden auto-TTS-overschrijving voor de huidige chat.
- `/tts persona <id>` schrijft de lokale personavoorkeur; `/tts persona off` wist deze.
- `/tts latest` leest het nieuwste assistentantwoord uit het huidige sessietranscript en verzendt het eenmaal als audio. Het slaat alleen een hash van dat antwoord op in de sessie-entry om dubbele stemverzendingen te onderdrukken.
- `/tts audio` genereert een eenmalig audioantwoord (schakelt TTS **niet** in).
- `limit` en `summary` worden opgeslagen in **lokale voorkeuren**, niet in de hoofdconfiguratie.
- `/tts status` bevat fallbackdiagnostiek voor de nieuwste poging — `Fallback: <primary> -> <used>`, `Attempts: ...` en details per poging (`provider:outcome(reasonCode) latency`).
- `/status` toont de actieve TTS-modus plus geconfigureerde provider, model, stem en opgeschoonde metadata voor aangepaste endpoints wanneer TTS is ingeschakeld.

## Voorkeuren per gebruiker

Slashcommando's schrijven lokale overschrijvingen naar `prefsPath`. De standaardwaarde is
`~/.openclaw/settings/tts.json`; overschrijf dit met de env-var `OPENCLAW_TTS_PREFS`
of `messages.tts.prefsPath`.

| Opgeslagen veld | Effect                                       |
| ------------ | -------------------------------------------- |
| `auto`       | Lokale auto-TTS-overschrijving (`always`, `off`, …) |
| `provider`   | Lokale primaire provideroverschrijving              |
| `persona`    | Lokale personaoverschrijving                       |
| `maxLength`  | Samenvattingsdrempel (standaard `1500` tekens)     |
| `summarize`  | Samenvattingsschakelaar (standaard `true`)              |

Deze overschrijven de effectieve configuratie uit `messages.tts` plus het actieve
`agents.list[].tts`-blok voor die host.

## Uitvoerformaten (vast)

TTS-stemlevering wordt bepaald door kanaalmogelijkheden. Kanaalplugins adverteren
of voice-style TTS providers moet vragen om een native `voice-note`-doel of
normale `audio-file`-synthese moet behouden en compatibele uitvoer alleen moet markeren voor stemlevering.

- **Kanalen met ondersteuning voor spraaknotities**: antwoorden als spraaknotitie geven de voorkeur aan Opus (`opus_48000_64` van ElevenLabs, `opus` van OpenAI).
  - 48 kHz / 64 kbps is een goede afweging voor spraakberichten.
- **Feishu / WhatsApp**: wanneer een antwoord als spraaknotitie wordt geproduceerd als MP3/WebM/WAV/M4A
  of een ander waarschijnlijk audiobestand, transcodeert de kanaalplugin dit met `ffmpeg` naar 48 kHz
  Ogg/Opus voordat het native spraakbericht wordt verzonden. WhatsApp verzendt
  het resultaat via de Baileys-`audio`-payload met `ptt: true` en
  `audio/ogg; codecs=opus`. Als conversie mislukt, ontvangt Feishu het originele
  bestand als bijlage; verzenden via WhatsApp mislukt in plaats van een incompatibele
  PTT-payload te plaatsen.
- **Andere kanalen**: MP3 (`mp3_44100_128` van ElevenLabs, `mp3` van OpenAI).
  - 44,1 kHz / 128 kbps is de standaardbalans voor spraakhelderheid.
- **MiniMax**: MP3 (`speech-2.8-hd`-model, samplefrequentie van 32 kHz) voor normale audiobijlagen. Voor door kanalen geadverteerde doelen voor spraaknotities transcodeert OpenClaw de MiniMax-MP3 met `ffmpeg` naar 48 kHz Opus vóór aflevering wanneer het kanaal transcoding adverteert.
- **Xiaomi MiMo**: standaard MP3, of WAV wanneer geconfigureerd. Voor door kanalen geadverteerde doelen voor spraaknotities transcodeert OpenClaw Xiaomi-uitvoer met `ffmpeg` naar 48 kHz Opus vóór aflevering wanneer het kanaal transcoding adverteert.
- **Lokale CLI**: gebruikt de geconfigureerde `outputFormat`. Doelen voor spraaknotities worden
  geconverteerd naar Ogg/Opus en telefonie-uitvoer wordt met `ffmpeg` geconverteerd naar ruwe 16 kHz mono PCM.
- **Google Gemini**: Gemini API TTS retourneert ruwe 24 kHz PCM. OpenClaw verpakt dit als WAV voor audiobijlagen, transcodeert het naar 48 kHz Opus voor doelen voor spraaknotities, en retourneert PCM direct voor Talk/telefonie.
- **Gradium**: WAV voor audiobijlagen, Opus voor doelen voor spraaknotities, en `ulaw_8000` op 8 kHz voor telefonie.
- **Inworld**: MP3 voor normale audiobijlagen, native `OGG_OPUS` voor doelen voor spraaknotities, en ruwe `PCM` op 22050 Hz voor Talk/telefonie.
- **xAI**: standaard MP3; `responseFormat` kan `mp3`, `wav`, `pcm`, `mulaw` of `alaw` zijn. OpenClaw gebruikt xAI's batch-REST-TTS-eindpunt en retourneert een volledige audiobijlage; xAI's streaming TTS WebSocket wordt niet gebruikt door dit providerpad. Native Opus-indeling voor spraaknotities wordt door dit pad niet ondersteund.
- **Microsoft**: gebruikt `microsoft.outputFormat` (standaard `audio-24khz-48kbitrate-mono-mp3`).
  - Het gebundelde transport accepteert een `outputFormat`, maar niet alle indelingen zijn beschikbaar vanuit de service.
  - Waarden voor uitvoerindelingen volgen Microsoft Speech-uitvoerindelingen (inclusief Ogg/WebM Opus).
  - Telegram `sendVoice` accepteert OGG/MP3/M4A; gebruik OpenAI/ElevenLabs als u
    gegarandeerde Opus-spraakberichten nodig hebt.
  - Als de geconfigureerde Microsoft-uitvoerindeling mislukt, probeert OpenClaw het opnieuw met MP3.

OpenAI/ElevenLabs-uitvoerindelingen liggen per kanaal vast (zie hierboven).

## Auto-TTS-gedrag

Wanneer `messages.tts.auto` is ingeschakeld, doet OpenClaw het volgende:

- Slaat TTS over als het antwoord al gestructureerde media bevat.
- Slaat zeer korte antwoorden over (minder dan 10 tekens).
- Vat lange antwoorden samen wanneer samenvattingen zijn ingeschakeld, met
  `summaryModel` (of `agents.defaults.model.primary`).
- Voegt de gegenereerde audio als bijlage toe aan het antwoord.
- In `mode: "final"` wordt nog steeds audio-only TTS verzonden voor gestreamde eindantwoorden
  nadat de tekststream is voltooid; de gegenereerde media doorlopen dezelfde
  kanaalmedianormalisatie als normale antwoordbijlagen.

Als het antwoord `maxLength` overschrijdt en samenvatting is uitgeschakeld (of er geen API-sleutel is voor het
samenvattingsmodel), wordt audio overgeslagen en wordt het normale tekstantwoord verzonden.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Uitvoerindelingen per kanaal

  | Doel                                  | Indeling                                                                                                                              |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Antwoorden als spraaknotitie geven de voorkeur aan **Opus** (`opus_48000_64` van ElevenLabs, `opus` van OpenAI). 48 kHz / 64 kbps brengt helderheid en grootte in balans. |
  | Andere kanalen                        | **MP3** (`mp3_44100_128` van ElevenLabs, `mp3` van OpenAI). 44,1 kHz / 128 kbps is de standaard voor spraak.                           |
  | Talk / telefonie                      | Provider-native **PCM** (Inworld 22050 Hz, Google 24 kHz), of `ulaw_8000` van Gradium voor telefonie.                                  |

  Opmerkingen per provider:

  - **Feishu / WhatsApp-transcodering:** Wanneer een antwoord als spraaknotitie binnenkomt als MP3/WebM/WAV/M4A, transcodeert de kanaal-Plugin dit naar 48 kHz Ogg/Opus met `ffmpeg`. WhatsApp verzendt via Baileys met `ptt: true` en `audio/ogg; codecs=opus`. Als de conversie mislukt: Feishu valt terug op het bijvoegen van het oorspronkelijke bestand; verzenden via WhatsApp mislukt in plaats van een incompatibele PTT-payload te plaatsen.
  - **MiniMax / Xiaomi MiMo:** Standaard MP3 (32 kHz voor MiniMax `speech-2.8-hd`); getranscodeerd naar 48 kHz Opus voor doelen voor spraaknotities via `ffmpeg`.
  - **Lokale CLI:** Gebruikt de geconfigureerde `outputFormat`. Doelen voor spraaknotities worden geconverteerd naar Ogg/Opus en telefonie-uitvoer naar ruwe 16 kHz mono PCM.
  - **Google Gemini:** Retourneert ruwe 24 kHz PCM. OpenClaw verpakt dit als WAV voor bijlagen, transcodeert naar 48 kHz Opus voor doelen voor spraaknotities, en retourneert PCM rechtstreeks voor Talk/telefonie.
  - **Inworld:** MP3-bijlagen, native `OGG_OPUS`-spraaknotitie, ruwe `PCM` 22050 Hz voor Talk/telefonie.
  - **xAI:** Standaard MP3; `responseFormat` kan `mp3|wav|pcm|mulaw|alaw` zijn. Gebruikt xAI's batch-REST-eindpunt — streaming WebSocket TTS wordt **niet** gebruikt. Native Opus-indeling voor spraaknotities wordt **niet** ondersteund.
  - **Microsoft:** Gebruikt `microsoft.outputFormat` (standaard `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accepteert OGG/MP3/M4A; gebruik OpenAI/ElevenLabs als je gegarandeerde Opus-spraakberichten nodig hebt. Als de geconfigureerde Microsoft-indeling mislukt, probeert OpenClaw het opnieuw met MP3.

  OpenAI- en ElevenLabs-uitvoerindelingen zijn per kanaal vastgezet zoals hierboven vermeld.

  ## Veldreferentie

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS-modus. `inbound` verzendt alleen audio na een inkomend spraakbericht; `tagged` verzendt alleen audio wanneer het antwoord `[[tts:...]]`-directieven of een `[[tts:text]]`-blok bevat.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Verouderde schakelaar. `openclaw doctor --fix` migreert dit naar `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` bevat tool-/blokantwoorden naast eindantwoorden.
    </ParamField>
    <ParamField path="provider" type="string">
      Spraakprovider-id. Wanneer niet ingesteld, gebruikt OpenClaw de eerste geconfigureerde provider in de automatische selectievolgorde van het register. Verouderde `provider: "edge"` wordt door `openclaw doctor --fix` herschreven naar `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      Actieve persona-id uit `personas`. Genormaliseerd naar kleine letters.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stabiele gesproken identiteit. Velden: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Zie [Persona's](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Goedkoop model voor automatische samenvatting; standaard `agents.defaults.model.primary`. Accepteert `provider/model` of een geconfigureerde modelalias.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Sta toe dat het model TTS-directieven uitstoot. `enabled` is standaard `true`; `allowProvider` is standaard `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Instellingen die eigendom zijn van de provider, gesleuteld op spraakprovider-id. Verouderde directe blokken (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) worden herschreven door `openclaw doctor --fix`; commit alleen `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Harde limiet voor TTS-invoertekens. `/tts audio` mislukt als deze wordt overschreden.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Aanvraagtime-out in milliseconden.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Overschrijf het lokale JSON-pad voor voorkeuren (provider/limiet/samenvatting). Standaard `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, of `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech-regio (bijv. `eastus`). Env: `AZURE_SPEECH_REGION` of `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionele overschrijving van Azure Speech-eindpunt (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">Azure-spraak ShortName. Standaard `en-US-JennyNeural`. Verouderde alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML-taalcode. Standaard `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` voor standaardaudio. Standaard `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` voor uitvoer als spraaknotitie. Standaard `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Valt terug op `ELEVENLABS_API_KEY` of `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Model-id (bijv. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs-spraak-id. Verouderde alias: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (elk `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normaal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Tekstnormalisatiemodus.</ParamField>
    <ParamField path="languageCode" type="string">2-letterige ISO 639-1 (bijv. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Geheel getal `0..4294967295` voor best-effort determinisme.</ParamField>
    <ParamField path="baseUrl" type="string">Overschrijf de basis-URL van de ElevenLabs-API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Valt terug op `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Indien weggelaten, kan TTS `models.providers.google.apiKey` hergebruiken voordat wordt teruggevallen op env.</ParamField>
    <ParamField path="model" type="string">Gemini TTS-model. Standaard `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini vooraf gebouwde spraaknaam. Standaard `Kore`. Verouderde aliassen: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Stijlprompt in natuurlijke taal die vóór gesproken tekst wordt geplaatst.</ParamField>
    <ParamField path="speakerName" type="string">Optioneel sprekerlabel dat vóór gesproken tekst wordt geplaatst wanneer je prompt een benoemde spreker gebruikt.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Stel in op `audio-profile-v1` om actieve persona-promptvelden in een deterministische Gemini TTS-promptstructuur te verpakken.</ParamField>
    <ParamField path="personaPrompt" type="string">Google-specifieke extra persona-prompttekst die wordt toegevoegd aan de regienotities van de sjabloon.</ParamField>
    <ParamField path="baseUrl" type="string">Alleen `https://generativelanguage.googleapis.com` wordt geaccepteerd.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standaard Emma (`YTpq7expH9539ERJ`). Verouderde alias: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Primaire Inworld

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standaard `inworld-tts-1.5-max`. Ook: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standaard `Sarah`. Verouderde alias: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Samplingtemperatuur `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Lokale CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokaal uitvoerbaar bestand of opdrachtstring voor CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Opdrachtargumenten. Ondersteunt de plaatsaanduidingen `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Verwachte uitvoerindeling van de CLI. Standaard `mp3` voor audiobijlagen.</ParamField>
    <ParamField path="timeoutMs" type="number">Time-out van opdracht in milliseconden. Standaard `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionele werkdirectory voor de opdracht.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionele omgevingsoverschrijvingen voor de opdracht.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (geen API-sleutel)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft-spraakgebruik toestaan.</ParamField>
    <ParamField path="speakerVoice" type="string">Naam van Microsoft-neural voice (bijv. `en-US-MichelleNeural`). Verouderde alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">Taalcode (bijv. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-uitvoerindeling. Standaard `audio-24khz-48kbitrate-mono-mp3`. Niet alle indelingen worden ondersteund door het gebundelde Edge-gebaseerde transport.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Percentagestrings (bijv. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">JSON-ondertitels naast het audiobestand schrijven.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL voor Microsoft-spraakverzoeken.</ParamField>
    <ParamField path="timeoutMs" type="number">Overschrijving van aanvraagtijdslimiet (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Verouderde alias. Voer `openclaw doctor --fix` uit om opgeslagen configuratie naar `providers.microsoft` te herschrijven.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Valt terug op `MINIMAX_API_KEY`. Token Plan-auth via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` of `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Standaard `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standaard `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`. Verouderde alias: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Standaard `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Standaard `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Integer `-12..12`. Standaard `0`. Fractionele waarden worden vóór de aanvraag afgekapt.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Valt terug op `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS-model-id (bijv. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Stemnaam (bijv. `alloy`, `cedar`). Verouderde alias: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Expliciet OpenAI-veld `instructions`. Wanneer ingesteld, worden personapromptvelden **niet** automatisch gemapt.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Extra JSON-velden die worden samengevoegd in aanvraagbodies voor `/audio/speech` na gegenereerde OpenAI TTS-velden. Gebruik dit voor OpenAI-compatibele eindpunten zoals Kokoro die providerspecifieke sleutels vereisen, zoals `lang`; onveilige prototypesleutels worden genegeerd.</ParamField>
    <ParamField path="baseUrl" type="string">
      Overschrijf het OpenAI TTS-eindpunt. Volgorde van resolutie: configuratie → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Niet-standaardwaarden worden behandeld als OpenAI-compatibele TTS-eindpunten, zodat aangepaste model- en stemnamen worden geaccepteerd.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Kan `models.providers.openrouter.apiKey` hergebruiken.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://openrouter.ai/api/v1`. Verouderde `https://openrouter.ai/v1` wordt genormaliseerd.</ParamField>
    <ParamField path="model" type="string">Standaard `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Standaard `af_alloy`. Verouderde aliassen: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Standaard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Providerspecifieke snelheidsoverschrijving.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Standaard `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Gebruik `seed-tts-2.0` wanneer je project TTS 2.0-rechten heeft.</ParamField>
    <ParamField path="appKey" type="string">App-sleutelheader. Standaard `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Overschrijf het Seed Speech TTS HTTP-eindpunt. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Stemtype. Standaard `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`. Verouderde alias: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Providerspecifieke snelheidsverhouding.</ParamField>
    <ParamField path="emotion" type="string">Providerspecifieke emotietag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Verouderde Volcengine Speech Console-velden. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (standaard `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Standaard `eve`. Live stemmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. Verouderde alias: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47-taalcode of `auto`. Standaard `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Standaard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Providerspecifieke snelheidsoverschrijving.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Standaard `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Ondersteunt ook `mimo-v2-tts` en `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Standaard `mimo_default` voor vooraf ingestelde stemmodellen. Env: `XIAOMI_TTS_VOICE`. Verouderde alias: `voice`. Niet verzonden voor `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Standaard `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Optionele stijlinstructie in natuurlijke taal die als gebruikersbericht wordt verzonden; wordt niet uitgesproken. Voor `mimo-v2.5-tts-voicedesign` is dit de voice-design-prompt; OpenClaw levert een standaardwaarde wanneer deze wordt weggelaten.</ParamField>
  </Accordion>
</AccordionGroup>

## Agenttool

De tool `tts` converteert tekst naar spraak en retourneert een audiobijlage voor
antwoordbezorging. Op Feishu, Matrix, Telegram en WhatsApp wordt de audio
bezorgd als spraakbericht in plaats van als bestandsbijlage. Feishu en
WhatsApp kunnen niet-Opus TTS-uitvoer op dit pad transcoderen wanneer `ffmpeg`
beschikbaar is.

WhatsApp verzendt audio via Baileys als een PTT-spraaknotitie (`audio` met
`ptt: true`) en verzendt zichtbare tekst **apart** van PTT-audio, omdat
clients bijschriften op spraaknotities niet consistent weergeven.

De tool accepteert optionele velden `channel` en `timeoutMs`; `timeoutMs` is een
per-aanroep aanvraagtijdslimiet voor de provider in milliseconden. Per-aanroepwaarden overschrijven
`messages.tts.timeoutMs`; geconfigureerde TTS-time-outs overschrijven elke door Plugin geschreven
standaardproviderwaarde.

## Gateway-RPC

| Methode           | Doel                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Huidige TTS-status en laatste poging lezen. |
| `tts.enable`      | Lokale automatische voorkeur instellen op `always`. |
| `tts.disable`     | Lokale automatische voorkeur instellen op `off`. |
| `tts.convert`     | Eenmalige tekst → audio.                 |
| `tts.setProvider` | Lokale providervoorkeur instellen.       |
| `tts.setPersona`  | Lokale personavoorkeur instellen.        |
| `tts.providers`   | Geconfigureerde providers en status weergeven. |

## Servicelinks

- [OpenAI-gids voor tekst-naar-spraak](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API-referentie](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST tekst-naar-spraak](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech-provider](/nl/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs-authenticatie](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/nl/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/nl/providers/volcengine#text-to-speech)
- [Xiaomi MiMo-spraaksynthese](/nl/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech-uitvoerindelingen](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI tekst naar spraak](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Gerelateerd

- [Mediaoverzicht](/nl/tools/media-overview)
- [Muziekgeneratie](/nl/tools/music-generation)
- [Videogeneratie](/nl/tools/video-generation)
- [Slash-opdrachten](/nl/tools/slash-commands)
- [Spraakoproep-Plugin](/nl/plugins/voice-call)
