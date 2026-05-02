---
read_when:
    - Tekst-naar-spraak inschakelen voor antwoorden
    - Een TTS-provider, fallbackketen of persona configureren
    - Gebruik van /tts-commando's of -richtlijnen
sidebarTitle: Text to speech (TTS)
summary: Tekst-naar-spraak voor uitgaande antwoorden — aanbieders, persona's, slash-commando's en uitvoer per kanaal
title: Tekst-naar-spraak
x-i18n:
    generated_at: "2026-05-02T11:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd5aadf91f42af1c25a59f12a5851e76ebb1a339bc8b236394fc2e33754d7e6
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw kan uitgaande antwoorden omzetten naar audio via **14 spraakaanbieders**
en native spraakberichten leveren op Feishu, Matrix, Telegram en WhatsApp,
audio-bijlagen overal elders, en PCM/Ulaw-streams voor telefonie en Talk.

## Snelstart

<Steps>
  <Step title="Kies een aanbieder">
    OpenAI en ElevenLabs zijn de betrouwbaarste gehoste opties. Microsoft en
    Local CLI werken zonder API-sleutel. Zie de [aanbiedermatrix](#supported-providers)
    voor de volledige lijst.
  </Step>
  <Step title="Stel de API-sleutel in">
    Exporteer de env var voor je aanbieder (bijvoorbeeld `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft en Local CLI hebben geen sleutel nodig.
  </Step>
  <Step title="Schakel in configuratie in">
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
    stuurt een eenmalig audioantwoord.
  </Step>
</Steps>

<Note>
Auto-TTS staat standaard **uit**. Wanneer `messages.tts.provider` niet is ingesteld,
kiest OpenClaw de eerste geconfigureerde aanbieder in de automatische selectieregistratievolgorde.
De ingebouwde agenttool `tts` is alleen voor expliciete intentie: gewone chat blijft
tekst, tenzij de gebruiker om audio vraagt, `/tts` gebruikt, of Auto-TTS/directive
speech inschakelt.
</Note>

## Ondersteunde aanbieders

| Aanbieder         | Auth                                                                                                             | Opmerkingen                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (ook `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)           | Native Ogg/Opus-spraaknotitie-uitvoer en telefonie.                     |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-compatibele TTS. Gebruikt standaard `hexgrad/Kokoro-82M`.        |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` of `XI_API_KEY`                                                                             | Stemklonen, meertalig, deterministisch via `seed`.                      |
| **Google Gemini** | `GEMINI_API_KEY` of `GOOGLE_API_KEY`                                                                             | Gemini API TTS; personabewust via `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Uitvoer voor spraaknotities en telefonie.                               |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS API. Native Opus-spraaknotitie en PCM-telefonie.          |
| **Local CLI**     | geen                                                                                                             | Voert een geconfigureerde lokale TTS-opdracht uit.                      |
| **Microsoft**     | geen                                                                                                             | Publieke Edge neural TTS via `node-edge-tts`. Best-effort, geen SLA.    |
| **MiniMax**       | `MINIMAX_API_KEY` (of Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API. Gebruikt standaard `speech-2.8-hd`.                         |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Ook gebruikt voor automatische samenvatting; ondersteunt persona-`instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kan `models.providers.openrouter.apiKey` hergebruiken)                                     | Standaardmodel `hexgrad/kokoro-82m`.                                    |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY` (legacy AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Gedeelde aanbieder voor afbeeldingen, video en spraak.                  |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch-TTS. Native Opus-spraaknotitie wordt **niet** ondersteund.    |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS via Xiaomi chat completions.                                   |

Als meerdere aanbieders zijn geconfigureerd, wordt de geselecteerde aanbieder eerst gebruikt en zijn de
andere fallbackopties. Automatische samenvatting gebruikt `summaryModel` (of
`agents.defaults.model.primary`), dus die aanbieder moet ook geauthenticeerd zijn
als je samenvattingen ingeschakeld houdt.

<Warning>
De gebundelde **Microsoft**-aanbieder gebruikt Microsoft Edge's online neural TTS-
service via `node-edge-tts`. Het is een publieke webservice zonder gepubliceerde
SLA of quotum — behandel deze als best-effort. De legacy aanbieder-id `edge` wordt
genormaliseerd naar `microsoft` en `openclaw doctor --fix` herschrijft opgeslagen
configuratie; nieuwe configuraties moeten altijd `microsoft` gebruiken.
</Warning>

## Configuratie

TTS-configuratie staat onder `messages.tts` in `~/.openclaw/openclaw.json`. Kies een
preset en pas het aanbiederblok aan:

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
          voice: "en-US-JennyNeural",
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
          voiceId: "EXAVITQu4vr4xnSDxMaL",
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
          voiceName: "Kore",
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
          voiceId: "YTpq7expH9539ERJ",
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
          voiceId: "Sarah",
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
          voice: "en-US-MichelleNeural",
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
          voiceId: "English_expressive_narrator",
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
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
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
          voice: "af_alloy",
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
          voice: "en_female_anna_mars_bigtts",
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
          voiceId: "eve",
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
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Stemoverschrijvingen per agent

Gebruik `agents.list[].tts` wanneer één agent met een andere aanbieder,
stem, model, persona of Auto-TTS-modus moet spreken. Het agentblok wordt diep samengevoegd over
`messages.tts`, zodat aanmeldgegevens van aanbieders in de globale aanbiederconfiguratie kunnen blijven:

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Om een persona per agent vast te zetten, stel je `agents.list[].tts.persona` in naast de aanbieder-
configuratie — dit overschrijft de globale `messages.tts.persona` alleen voor die agent.

Volgorde van prioriteit voor automatische antwoorden, `/tts audio`, `/tts status`, en de
agenttool `tts`:

1. `messages.tts`
2. actieve `agents.list[].tts`
3. kanaaloverschrijving, wanneer het kanaal `channels.<channel>.tts` ondersteunt
4. accountoverschrijving, wanneer het kanaal `channels.<channel>.accounts.<id>.tts` doorgeeft
5. lokale `/tts`-voorkeuren voor deze host
6. inline `[[tts:...]]`-directieven wanneer [modeloverschrijvingen](#model-driven-directives) zijn ingeschakeld

Kanaal- en accountoverschrijvingen gebruiken dezelfde vorm als `messages.tts` en
worden deep-merged over de eerdere lagen, zodat gedeelde providerreferenties in
`messages.tts` kunnen blijven terwijl een kanaal- of botaccount alleen stem, model, persona,
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
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persona's

Een **persona** is een stabiele gesproken identiteit die deterministisch
over providers heen kan worden toegepast. Deze kan één provider verkiezen, providerneutrale promptintentie
definiëren, en providerspecifieke koppelingen bevatten voor stemmen, modellen, prompt-
sjablonen, seeds en steminstellingen.

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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
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
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
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

Voor elke providerpoging voegt OpenClaw configuraties in deze volgorde samen:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrouwde verzoekoverschrijvingen
4. Toegestane door het model uitgegeven TTS-directiefoverschrijvingen

### Hoe providers persona-prompts gebruiken

Persona-promptvelden (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) zijn **providerneutraal**. Elke provider bepaalt hoe
ze worden gebruikt:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Verpakt persona-promptvelden in een Gemini TTS-promptstructuur **alleen wanneer**
    de effectieve Google-providerconfiguratie `promptTemplate: "audio-profile-v1"`
    of `personaPrompt` instelt. De oudere velden `audioProfile` en `speakerName` worden
    nog steeds vooraf toegevoegd als Google-specifieke prompttekst. Inline audiotags zoals
    `[whispers]` of `[laughs]` binnen een `[[tts:text]]`-blok blijven behouden
    in het Gemini-transcript; OpenClaw genereert deze tags niet.
  </Accordion>
  <Accordion title="OpenAI">
    Koppelt persona-promptvelden aan het verzoekveld `instructions` **alleen wanneer**
    er geen expliciete OpenAI-`instructions` is geconfigureerd. Expliciete `instructions`
    hebben altijd voorrang.
  </Accordion>
  <Accordion title="Andere providers">
    Gebruiken alleen de providerspecifieke persona-koppelingen onder
    `personas.<id>.providers.<provider>`. Persona-promptvelden worden genegeerd
    tenzij de provider zijn eigen persona-promptmapping implementeert.
  </Accordion>
</AccordionGroup>

### Fallbackbeleid

`fallbackPolicy` bepaalt het gedrag wanneer een persona **geen koppeling** heeft voor de
geprobeerde provider:

| Beleid              | Gedrag                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Standaard.** Providerneutrale promptvelden blijven beschikbaar; de provider kan ze gebruiken of negeren.                                          |
| `provider-defaults` | Persona wordt weggelaten uit de promptvoorbereiding voor die poging; de provider gebruikt zijn neutrale standaardwaarden terwijl fallback naar andere providers doorgaat. |
| `fail`              | Sla die providerpoging over met `reasonCode: "not_configured"` en `personaBinding: "missing"`. Fallbackproviders worden nog steeds geprobeerd.       |

Het volledige TTS-verzoek mislukt alleen wanneer **elke** geprobeerde provider wordt overgeslagen
of mislukt.

## Modelgestuurde directieven

Standaard **kan** de assistant `[[tts:...]]`-directieven uitgeven om
stem, model of snelheid voor één antwoord te overschrijven, plus een optioneel
`[[tts:text]]...[[/tts:text]]`-blok voor expressieve aanwijzingen die alleen in
audio moeten verschijnen:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Wanneer `messages.tts.auto` `"tagged"` is, zijn **directieven vereist** om
audio te activeren. Streaming-bloklevering verwijdert directieven uit zichtbare tekst voordat het
kanaal ze ziet, zelfs wanneer ze over aangrenzende blokken zijn gesplitst.

`provider=...` wordt genegeerd tenzij `modelOverrides.allowProvider: true`. Wanneer een
antwoord `provider=...` declareert, worden de andere sleutels in die directieve
alleen door die provider geparseerd; niet-ondersteunde sleutels worden verwijderd en gerapporteerd als TTS-
directiefwaarschuwingen.

**Beschikbare directiefsleutels:**

- `provider` (geregistreerde provider-id; vereist `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-volume, 0–10)
- `pitch` (MiniMax-integerpitch, −12 tot 12; fractionele waarden worden afgekapt)
- `emotion` (Volcengine-emotietag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Modeloverschrijvingen volledig uitschakelen:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Providers wisselen toestaan terwijl andere instellingen configureerbaar blijven:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-opdrachten

Enkele opdracht `/tts`. Op Discord registreert OpenClaw ook `/voice` omdat
`/tts` een ingebouwde Discord-opdracht is — tekst `/tts ...` werkt nog steeds.

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
Opdrachten vereisen een geautoriseerde afzender (allowlist-/eigenaarsregels zijn van toepassing) en ofwel
`commands.text` of native opdrachtregistratie moet zijn ingeschakeld.
</Note>

Gedragsnotities:

- `/tts on` schrijft de lokale TTS-voorkeur naar `always`; `/tts off` schrijft deze naar `off`.
- `/tts chat on|off|default` schrijft een sessiegebonden automatische TTS-overschrijving voor de huidige chat.
- `/tts persona <id>` schrijft de lokale persona-voorkeur; `/tts persona off` wist deze.
- `/tts latest` leest het nieuwste assistant-antwoord uit het huidige sessietranscript en verzendt het eenmaal als audio. Het bewaart alleen een hash van dat antwoord op de sessie-entry om dubbele stemverzendingen te onderdrukken.
- `/tts audio` genereert een eenmalig audioantwoord (schakelt TTS **niet** in).
- `limit` en `summary` worden opgeslagen in **lokale voorkeuren**, niet in de hoofdconfiguratie.
- `/tts status` bevat fallbackdiagnostiek voor de nieuwste poging — `Fallback: <primary> -> <used>`, `Attempts: ...`, en details per poging (`provider:outcome(reasonCode) latency`).
- `/status` toont de actieve TTS-modus plus geconfigureerde provider, model, stem en opgeschoonde aangepaste endpointmetadata wanneer TTS is ingeschakeld.

## Voorkeuren per gebruiker

Slash-opdrachten schrijven lokale overschrijvingen naar `prefsPath`. De standaardwaarde is
`~/.openclaw/settings/tts.json`; overschrijf met de env-var `OPENCLAW_TTS_PREFS`
of `messages.tts.prefsPath`.

| Opgeslagen veld | Effect                                            |
| --------------- | ------------------------------------------------- |
| `auto`          | Lokale automatische TTS-overschrijving (`always`, `off`, …) |
| `provider`      | Lokale primaire provideroverride                  |
| `persona`       | Lokale persona-overschrijving                     |
| `maxLength`     | Samenvattingsdrempel (standaard `1500` tekens)    |
| `summarize`     | Samenvattingsschakelaar (standaard `true`)        |

Deze overschrijven de effectieve configuratie uit `messages.tts` plus het actieve
`agents.list[].tts`-blok voor die host.

## Uitvoerformaten (vast)

TTS-stemlevering wordt aangestuurd door kanaalcapaciteiten. Channel-Plugins adverteren
of TTS in stemstijl providers moet vragen om een native `voice-note`-doel of
normale `audio-file`-synthese moet behouden en alleen compatibele uitvoer moet markeren voor stemlevering.

- **Kanalen met spraaknotitie-ondersteuning**: spraaknotitie-antwoorden geven de voorkeur aan Opus (`opus_48000_64` van ElevenLabs, `opus` van OpenAI).
  - 48kHz / 64kbps is een goede afweging voor spraakberichten.
- **Feishu / WhatsApp**: wanneer een spraaknotitie-antwoord wordt geproduceerd als MP3/WebM/WAV/M4A
  of een ander waarschijnlijk audiobestand, transcodeert de kanaal-Plugin dit naar 48kHz
  Ogg/Opus met `ffmpeg` voordat het native spraakbericht wordt verzonden. WhatsApp verzendt
  het resultaat via de Baileys-`audio`-payload met `ptt: true` en
  `audio/ogg; codecs=opus`. Als conversie mislukt, ontvangt Feishu het oorspronkelijke
  bestand als bijlage; verzenden via WhatsApp mislukt in plaats van een incompatibele
  PTT-payload te plaatsen.
- **BlueBubbles**: houdt providersynthese op het normale audiobestandspad; MP3-
  en CAF-uitvoer worden gemarkeerd voor bezorging als iMessage-spraakmemo.
- **Andere kanalen**: MP3 (`mp3_44100_128` van ElevenLabs, `mp3` van OpenAI).
  - 44,1kHz / 128kbps is de standaardbalans voor spraakhelderheid.
- **MiniMax**: MP3 (`speech-2.8-hd`-model, 32kHz-samplefrequentie) voor normale audiobijlagen. Voor door kanalen geadverteerde spraaknotitie-doelen transcodeert OpenClaw de MiniMax-MP3 naar 48kHz Opus met `ffmpeg` vóór bezorging wanneer het kanaal transcoding adverteert.
- **Xiaomi MiMo**: standaard MP3, of WAV wanneer geconfigureerd. Voor door kanalen geadverteerde spraaknotitie-doelen transcodeert OpenClaw Xiaomi-uitvoer naar 48kHz Opus met `ffmpeg` vóór bezorging wanneer het kanaal transcoding adverteert.
- **Lokale CLI**: gebruikt de geconfigureerde `outputFormat`. Spraaknotitie-doelen worden
  geconverteerd naar Ogg/Opus en telefonie-uitvoer wordt geconverteerd naar ruwe 16 kHz mono PCM
  met `ffmpeg`.
- **Google Gemini**: Gemini API TTS retourneert ruwe 24kHz PCM. OpenClaw verpakt dit als WAV voor audiobijlagen, transcodeert het naar 48kHz Opus voor spraaknotitie-doelen en retourneert PCM rechtstreeks voor Talk/telefonie.
- **Gradium**: WAV voor audiobijlagen, Opus voor spraaknotitie-doelen en `ulaw_8000` op 8 kHz voor telefonie.
- **Inworld**: MP3 voor normale audiobijlagen, native `OGG_OPUS` voor spraaknotitie-doelen en ruwe `PCM` op 22050 Hz voor Talk/telefonie.
- **xAI**: standaard MP3; `responseFormat` kan `mp3`, `wav`, `pcm`, `mulaw` of `alaw` zijn. OpenClaw gebruikt xAI's batch-REST-TTS-eindpunt en retourneert een volledige audiobijlage; xAI's streaming TTS-WebSocket wordt niet gebruikt door dit providerpad. Native Opus-spraaknotitie-indeling wordt niet ondersteund door dit pad.
- **Microsoft**: gebruikt `microsoft.outputFormat` (standaard `audio-24khz-48kbitrate-mono-mp3`).
  - Het gebundelde transport accepteert een `outputFormat`, maar niet alle indelingen zijn beschikbaar vanuit de service.
  - Uitvoerindelingswaarden volgen Microsoft Speech-uitvoerindelingen (inclusief Ogg/WebM Opus).
  - Telegram `sendVoice` accepteert OGG/MP3/M4A; gebruik OpenAI/ElevenLabs als je
    gegarandeerde Opus-spraakberichten nodig hebt.
  - Als de geconfigureerde Microsoft-uitvoerindeling mislukt, probeert OpenClaw het opnieuw met MP3.

OpenAI/ElevenLabs-uitvoerindelingen zijn per kanaal vastgelegd (zie hierboven).

## Auto-TTS-gedrag

Wanneer `messages.tts.auto` is ingeschakeld, doet OpenClaw het volgende:

- Slaat TTS over als het antwoord al media of een `MEDIA:`-richtlijn bevat.
- Slaat zeer korte antwoorden over (minder dan 10 tekens).
- Vat lange antwoorden samen wanneer samenvattingen zijn ingeschakeld, met
  `summaryModel` (of `agents.defaults.model.primary`).
- Voegt de gegenereerde audio toe aan het antwoord.
- In `mode: "final"` wordt nog steeds audio-only TTS verzonden voor gestreamde eindantwoorden
  nadat de tekststream is voltooid; de gegenereerde media gaat door dezelfde
  kanaalmedianormalisatie als normale antwoordbijlagen.

Als het antwoord `maxLength` overschrijdt en samenvatten uit staat (of er geen API-sleutel is voor het
samenvattingsmodel), wordt audio overgeslagen en wordt het normale tekstantwoord verzonden.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
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
| Feishu / Matrix / Telegram / WhatsApp | Spraaknotitie-antwoorden geven de voorkeur aan **Opus** (`opus_48000_64` van ElevenLabs, `opus` van OpenAI). 48 kHz / 64 kbps balanceert helderheid en grootte. |
| Andere kanalen                        | **MP3** (`mp3_44100_128` van ElevenLabs, `mp3` van OpenAI). 44,1 kHz / 128 kbps is de standaard voor spraak.                          |
| Talk / telefonie                      | Provider-native **PCM** (Inworld 22050 Hz, Google 24 kHz), of `ulaw_8000` van Gradium voor telefonie.                                 |

Opmerkingen per provider:

- **Feishu / WhatsApp-transcoding:** Wanneer een spraaknotitie-antwoord binnenkomt als MP3/WebM/WAV/M4A, transcodeert de kanaal-Plugin naar 48 kHz Ogg/Opus met `ffmpeg`. WhatsApp verzendt via Baileys met `ptt: true` en `audio/ogg; codecs=opus`. Als conversie mislukt: Feishu valt terug op het bijvoegen van het oorspronkelijke bestand; verzenden via WhatsApp mislukt in plaats van een incompatibele PTT-payload te plaatsen.
- **MiniMax / Xiaomi MiMo:** Standaard MP3 (32 kHz voor MiniMax `speech-2.8-hd`); getranscodeerd naar 48 kHz Opus voor spraaknotitie-doelen via `ffmpeg`.
- **Lokale CLI:** Gebruikt geconfigureerde `outputFormat`. Spraaknotitie-doelen worden geconverteerd naar Ogg/Opus en telefonie-uitvoer naar ruwe 16 kHz mono PCM.
- **Google Gemini:** Retourneert ruwe 24 kHz PCM. OpenClaw verpakt dit als WAV voor bijlagen, transcodeert naar 48 kHz Opus voor spraaknotitie-doelen, retourneert PCM rechtstreeks voor Talk/telefonie.
- **Inworld:** MP3-bijlagen, native `OGG_OPUS`-spraaknotitie, ruwe `PCM` 22050 Hz voor Talk/telefonie.
- **xAI:** Standaard MP3; `responseFormat` kan `mp3|wav|pcm|mulaw|alaw` zijn. Gebruikt xAI's batch-REST-eindpunt — streaming WebSocket TTS wordt **niet** gebruikt. Native Opus-spraaknotitie-indeling wordt **niet** ondersteund.
- **Microsoft:** Gebruikt `microsoft.outputFormat` (standaard `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accepteert OGG/MP3/M4A; gebruik OpenAI/ElevenLabs als je gegarandeerde Opus-spraakberichten nodig hebt. Als de geconfigureerde Microsoft-indeling mislukt, probeert OpenClaw het opnieuw met MP3.

OpenAI- en ElevenLabs-uitvoerindelingen zijn per kanaal vastgelegd zoals hierboven vermeld.

## Veldreferentie

<AccordionGroup>
  <Accordion title="Toplevel messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS-modus. `inbound` verzendt alleen audio na een inkomend spraakbericht; `tagged` verzendt alleen audio wanneer het antwoord `[[tts:...]]`-richtlijnen of een `[[tts:text]]`-blok bevat.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Verouderde schakelaar. `openclaw doctor --fix` migreert dit naar `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` omvat tool-/blokantwoorden naast eindantwoorden.
    </ParamField>
    <ParamField path="provider" type="string">
      Spraakprovider-id. Wanneer dit niet is ingesteld, gebruikt OpenClaw de eerste geconfigureerde provider in de automatische selecteervolgorde van het register. Verouderde `provider: "edge"` wordt door `openclaw doctor --fix` herschreven naar `"microsoft"`.
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
      Sta het model toe TTS-richtlijnen uit te sturen. `enabled` is standaard `true`; `allowProvider` is standaard `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Provider-eigen instellingen gesleuteld op spraakprovider-id. Verouderde directe blokken (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) worden herschreven door `openclaw doctor --fix`; commit alleen `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Harde limiet voor TTS-invoertekens. `/tts audio` mislukt als deze wordt overschreden.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Aanvraagtime-out in milliseconden.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Overschrijf het lokale prefs-JSON-pad (provider/limiet/samenvatting). Standaard `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, of `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech-regio (bijv. `eastus`). Env: `AZURE_SPEECH_REGION` of `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionele Azure Speech-eindpunt-override (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure-spraak ShortName. Standaard `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">SSML-taalcode. Standaard `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` voor standaardaudio. Standaard `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` voor spraaknotitie-uitvoer. Standaard `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Valt terug op `ELEVENLABS_API_KEY` of `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Model-id (bijv. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs-spraak-id.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (elk `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normaal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Tekstnormalisatiemodus.</ParamField>
    <ParamField path="languageCode" type="string">2-letterige ISO 639-1 (bijv. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Geheel getal `0..4294967295` voor best-effort determinisme.</ParamField>
    <ParamField path="baseUrl" type="string">Overschrijf de basis-URL van de ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Valt terug op `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Indien weggelaten, kan TTS `models.providers.google.apiKey` hergebruiken vóór env-terugval.</ParamField>
    <ParamField path="model" type="string">Gemini TTS-model. Standaard `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Gemini vooraf gebouwde spraaknaam. Standaard `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Stijlprompt in natuurlijke taal die vóór gesproken tekst wordt geplaatst.</ParamField>
    <ParamField path="speakerName" type="string">Optioneel sprekerlabel dat vóór gesproken tekst wordt geplaatst wanneer je prompt een benoemde spreker gebruikt.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Stel in op `audio-profile-v1` om actieve persona-promptvelden in een deterministische Gemini TTS-promptstructuur te verpakken.</ParamField>
    <ParamField path="personaPrompt" type="string">Google-specifieke extra persona-prompttekst die wordt toegevoegd aan de regisseursnotities van de template.</ParamField>
    <ParamField path="baseUrl" type="string">Alleen `https://generativelanguage.googleapis.com` wordt geaccepteerd.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standaard `inworld-tts-1.5-max`. Ook: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Samplingtemperatuur `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokaal uitvoerbaar bestand of opdrachtstring voor CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Opdrachtargumenten. Ondersteunt de placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Verwachte CLI-uitvoerindeling. Standaard `mp3` voor audiobijlagen.</ParamField>
    <ParamField path="timeoutMs" type="number">Opdrachttime-out in milliseconden. Standaard `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionele werkmap voor de opdracht.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionele omgevingsoverschrijvingen voor de opdracht.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft-spraakgebruik toestaan.</ParamField>
    <ParamField path="voice" type="string">Naam van Microsoft neural voice (bijv. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Taalcode (bijv. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-uitvoerindeling. Standaard `audio-24khz-48kbitrate-mono-mp3`. Niet alle indelingen worden ondersteund door het meegeleverde Edge-gebaseerde transport.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Percentagestrings (bijv. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Schrijf JSON-ondertitels naast het audiobestand.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL voor Microsoft-spraakverzoeken.</ParamField>
    <ParamField path="timeoutMs" type="number">Overschrijving van aanvraagt-time-out (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Verouderde alias. Voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven naar `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Valt terug op `MINIMAX_API_KEY`. Token Plan-authenticatie via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` of `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Standaard `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Standaard `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Standaard `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Integer `-12..12`. Standaard `0`. Fractionele waarden worden vóór de aanvraag afgekapt.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Valt terug op `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS-model-id (bijv. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Stemnaam (bijv. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Expliciet OpenAI-veld `instructions`. Wanneer dit is ingesteld, worden persona-promptvelden **niet** automatisch toegewezen.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Extra JSON-velden die worden samengevoegd in aanvraagbody's voor `/audio/speech` na gegenereerde OpenAI TTS-velden. Gebruik dit voor OpenAI-compatibele endpoints zoals Kokoro die providerspecifieke sleutels zoals `lang` vereisen; onveilige prototypesleutels worden genegeerd.</ParamField>
    <ParamField path="baseUrl" type="string">
      Overschrijf het OpenAI TTS-endpoint. Resolutievolgorde: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Niet-standaard waarden worden behandeld als OpenAI-compatibele TTS-endpoints, dus aangepaste model- en stemnamen worden geaccepteerd.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Kan `models.providers.openrouter.apiKey` hergebruiken.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://openrouter.ai/api/v1`. Verouderde `https://openrouter.ai/v1` wordt genormaliseerd.</ParamField>
    <ParamField path="model" type="string">Standaard `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Standaard `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Standaard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Providerspecifieke snelheidsoverschrijving.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Standaard `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Gebruik `seed-tts-2.0` wanneer je project recht heeft op TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">App-key-header. Standaard `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Overschrijf het Seed Speech TTS HTTP-endpoint. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Stemtype. Standaard `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Providerspecifieke snelheidsratio.</ParamField>
    <ParamField path="emotion" type="string">Providerspecifieke emotietag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Verouderde velden van de Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (standaard `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard `eve`. Live stemmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">BCP-47-taalcode of `auto`. Standaard `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Standaard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Providerspecifieke snelheidsoverschrijving.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Standaard `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Ondersteunt ook `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Standaard `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Standaard `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Optionele stijl-instructie in natuurlijke taal die als gebruikersbericht wordt verzonden; wordt niet uitgesproken.</ParamField>
  </Accordion>
</AccordionGroup>

## Agenttool

De tool `tts` zet tekst om naar spraak en retourneert een audiobijlage voor
antwoordbezorging. Op Feishu, Matrix, Telegram en WhatsApp wordt de audio
bezorgd als spraakbericht in plaats van als bestandsbijlage. Feishu en
WhatsApp kunnen niet-Opus TTS-uitvoer op dit pad transcoderen wanneer `ffmpeg`
beschikbaar is.

WhatsApp verzendt audio via Baileys als een PTT-spraaknotitie (`audio` met
`ptt: true`) en verzendt zichtbare tekst **apart** van PTT-audio, omdat
clients bijschriften bij spraaknotities niet consequent weergeven.

De tool accepteert optionele velden `channel` en `timeoutMs`; `timeoutMs` is een
time-out per aanroep voor providerverzoeken in milliseconden.

## Gateway RPC

| Methode           | Doel                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Lees de huidige TTS-status en laatste poging. |
| `tts.enable`      | Stel lokale automatische voorkeur in op `always`. |
| `tts.disable`     | Stel lokale automatische voorkeur in op `off`. |
| `tts.convert`     | Eenmalig tekst → audio.                  |
| `tts.setProvider` | Stel lokale providervoorkeur in.         |
| `tts.setPersona`  | Stel lokale personavoorkeur in.          |
| `tts.providers`   | Toon geconfigureerde providers en status. |

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

- [Media-overzicht](/nl/tools/media-overview)
- [Muziekgeneratie](/nl/tools/music-generation)
- [Videogeneratie](/nl/tools/video-generation)
- [Slash-opdrachten](/nl/tools/slash-commands)
- [Spraakoproep-Plugin](/nl/plugins/voice-call)
