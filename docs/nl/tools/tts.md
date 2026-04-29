---
read_when:
    - Tekst-naar-spraak inschakelen voor antwoorden
    - Een TTS-provider, fallbackketen of persona configureren
    - Gebruik van /tts-opdrachten of -richtlijnen
sidebarTitle: Text to speech (TTS)
summary: Tekst-naar-spraak voor uitgaande antwoorden — providers, persona's, slashcommando's en uitvoer per kanaal
title: Tekst-naar-spraak
x-i18n:
    generated_at: "2026-04-29T23:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw kan uitgaande antwoorden omzetten naar audio via **14 spraakproviders**
en native spraakberichten leveren op Feishu, Matrix, Telegram en WhatsApp,
audiobijlagen overal elders, en PCM/Ulaw-streams voor telefonie en Talk.

## Snelstart

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
  <Step title="Schakel dit in de configuratie in">
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
  <Step title="Probeer het in de chat">
    `/tts status` toont de huidige status. `/tts audio Hello from OpenClaw`
    verstuurt een eenmalig audioantwoord.
  </Step>
</Steps>

<Note>
Auto-TTS staat standaard **uit**. Wanneer `messages.tts.provider` niet is ingesteld,
kiest OpenClaw de eerste geconfigureerde provider in de auto-selectievolgorde van het register.
</Note>

## Ondersteunde providers

| Provider          | Auth                                                                                                             | Opmerkingen                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (ook `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)           | Native Ogg/Opus-spraaknotitie-uitvoer en telefonie.                     |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-compatibele TTS. Standaard ingesteld op `hexgrad/Kokoro-82M`.    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` of `XI_API_KEY`                                                                             | Stemklonen, meertalig, deterministisch via `seed`.                      |
| **Google Gemini** | `GEMINI_API_KEY` of `GOOGLE_API_KEY`                                                                             | Gemini API TTS; persona-bewust via `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Spraaknotitie- en telefonie-uitvoer.                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS-API. Native Opus-spraaknotitie en PCM-telefonie.          |
| **Local CLI**     | geen                                                                                                             | Voert een geconfigureerde lokale TTS-opdracht uit.                      |
| **Microsoft**     | geen                                                                                                             | Publieke Edge neural TTS via `node-edge-tts`. Naar beste vermogen, geen SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (of Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2-API. Standaard ingesteld op `speech-2.8-hd`.                     |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Ook gebruikt voor automatische samenvatting; ondersteunt persona-`instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (kan `models.providers.openrouter.apiKey` hergebruiken)                                     | Standaardmodel `hexgrad/kokoro-82m`.                                    |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY` (verouderde AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP-API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Gedeelde image-, video- en spraakprovider.                              |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch-TTS. Native Opus-spraaknotitie wordt **niet** ondersteund.    |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS via Xiaomi-chatvoltooiingen.                                   |

Als meerdere providers zijn geconfigureerd, wordt de geselecteerde eerst gebruikt en zijn de
andere terugvalopties. Automatische samenvatting gebruikt `summaryModel` (of
`agents.defaults.model.primary`), dus die provider moet ook geauthenticeerd zijn
als je samenvattingen ingeschakeld houdt.

<Warning>
De gebundelde **Microsoft**-provider gebruikt de online neurale TTS-service
van Microsoft Edge via `node-edge-tts`. Het is een openbare webservice zonder
gepubliceerde SLA of quota — behandel deze als een service op basis van beste inspanning. De verouderde provider-id `edge` wordt
genormaliseerd naar `microsoft` en `openclaw doctor --fix` herschrijft opgeslagen
configuratie; nieuwe configuraties moeten altijd `microsoft` gebruiken.
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
  <Tab title="Microsoft (no key)">
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

### Spraakoverschrijvingen per agent

Gebruik `agents.list[].tts` wanneer één agent moet spreken met een andere provider,
stem, model, persona of automatische TTS-modus. Het agentblok wordt diep samengevoegd over
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
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Om een persona per agent vast te zetten, stel `agents.list[].tts.persona` in naast de providerconfiguratie — dit overschrijft de globale `messages.tts.persona` alleen voor die agent.

Volgorde van prioriteit voor automatische antwoorden, `/tts audio`, `/tts status` en de
agenttool `tts`:

1. `messages.tts`
2. actieve `agents.list[].tts`
3. kanaaloverschrijving, wanneer het kanaal `channels.<channel>.tts` ondersteunt
4. accountoverschrijving, wanneer het kanaal `channels.<channel>.accounts.<id>.tts` doorgeeft
5. lokale `/tts`-voorkeuren voor deze host
6. inline `[[tts:...]]`-directieven wanneer [modeloverschrijvingen](#model-driven-directives) zijn ingeschakeld

Kanaal- en accountoverschrijvingen gebruiken dezelfde vorm als `messages.tts` en
worden met een deep merge samengevoegd over de eerdere lagen, zodat gedeelde providerreferenties in
`messages.tts` kunnen blijven terwijl een kanaal of botaccount alleen de stem, het model, de persona
of de automatische modus wijzigt:

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
definiëren en providerspecifieke bindingen bevatten voor stemmen, modellen, promptsjablonen,
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

### Personaresolutie

De actieve persona wordt deterministisch geselecteerd:

1. `/tts persona <id>` lokale voorkeur, indien ingesteld.
2. `messages.tts.persona`, indien ingesteld.
3. Geen persona.

Providerselectie verloopt expliciet eerst:

1. Directe overschrijvingen (CLI, Gateway, Talk, toegestane TTS-directives).
2. `/tts provider <id>` lokale voorkeur.
3. De `provider` van de actieve persona.
4. `messages.tts.provider`.
5. Automatische registerselectie.

Voor elke providerpoging voegt OpenClaw configuraties in deze volgorde samen:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Vertrouwde aanvraagoverschrijvingen
4. Toegestane door het model uitgezonden TTS-directive-overschrijvingen

### Hoe providers personaprompts gebruiken

Personapromptvelden (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) zijn **providerneutraal**. Elke provider bepaalt hoe
deze worden gebruikt:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Verpakt personapromptvelden in een Gemini TTS-promptstructuur **alleen wanneer**
    de effectieve Google-providerconfiguratie `promptTemplate: "audio-profile-v1"`
    of `personaPrompt` instelt. De oudere velden `audioProfile` en `speakerName` worden
    nog steeds vooraf toegevoegd als Google-specifieke prompttekst. Inline audiotags zoals
    `[whispers]` of `[laughs]` binnen een `[[tts:text]]`-blok blijven behouden
    binnen het Gemini-transcript; OpenClaw genereert deze tags niet.
  </Accordion>
  <Accordion title="OpenAI">
    Koppelt personapromptvelden aan het aanvraagveld `instructions` **alleen wanneer**
    er geen expliciete OpenAI-`instructions` is geconfigureerd. Expliciete `instructions`
    heeft altijd voorrang.
  </Accordion>
  <Accordion title="Other providers">
    Gebruiken alleen de providerspecifieke personabindingen onder
    `personas.<id>.providers.<provider>`. Personapromptvelden worden genegeerd,
    tenzij de provider een eigen persona-promptkoppeling implementeert.
  </Accordion>
</AccordionGroup>

### Fallbackbeleid

`fallbackPolicy` bepaalt het gedrag wanneer een persona **geen binding** heeft voor de
geprobeerde provider:

| Beleid              | Gedrag                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Standaard.** Providerneutrale promptvelden blijven beschikbaar; de provider kan ze gebruiken of negeren.                                            |
| `provider-defaults` | Persona wordt weggelaten uit promptvoorbereiding voor die poging; de provider gebruikt zijn neutrale standaardwaarden terwijl fallback naar andere providers doorgaat. |
| `fail`              | Sla die providerpoging over met `reasonCode: "not_configured"` en `personaBinding: "missing"`. Fallbackproviders worden nog steeds geprobeerd.              |

De volledige TTS-aanvraag mislukt alleen wanneer **elke** geprobeerde provider wordt overgeslagen
of mislukt.

## Modelgestuurde directives

Standaard **kan** de assistent `[[tts:...]]`-directives uitzenden om
stem, model of snelheid voor één antwoord te overschrijven, plus een optioneel
`[[tts:text]]...[[/tts:text]]`-blok voor expressieve aanwijzingen die alleen in
audio moeten verschijnen:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Wanneer `messages.tts.auto` `"tagged"` is, zijn **directives vereist** om
audio te activeren. Streamingbloklevering verwijdert directives uit zichtbare tekst voordat het
kanaal ze ziet, zelfs wanneer ze over aangrenzende blokken zijn gesplitst.

`provider=...` wordt genegeerd tenzij `modelOverrides.allowProvider: true`. Wanneer een
antwoord `provider=...` declareert, worden de andere sleutels in die directive
alleen door die provider geparsed; niet-ondersteunde sleutels worden verwijderd en gerapporteerd als TTS
directive-waarschuwingen.

**Beschikbare directive-sleutels:**

- `provider` (geregistreerde provider-id; vereist `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-volume, 0-10)
- `pitch` (MiniMax-gehele pitch, −12 tot 12; fractionele waarden worden afgekapt)
- `emotion` (Volcengine-emotietag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Modeloverschrijvingen volledig uitschakelen:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Providerwisseling toestaan terwijl andere knoppen configureerbaar blijven:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash-commando's

Enkel commando `/tts`. Op Discord registreert OpenClaw ook `/voice` omdat
`/tts` een ingebouwd Discord-commando is — tekst `/tts ...` werkt nog steeds.

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
Commando's vereisen een geautoriseerde afzender (allowlist-/eigenaarsregels zijn van toepassing) en ofwel
`commands.text` of native commandoregistratie moet zijn ingeschakeld.
</Note>

Gedragsnotities:

- `/tts on` schrijft de lokale TTS-voorkeur naar `always`; `/tts off` schrijft deze naar `off`.
- `/tts chat on|off|default` schrijft een sessiegebonden auto-TTS-overschrijving voor de huidige chat.
- `/tts persona <id>` schrijft de lokale personavoorkeur; `/tts persona off` wist deze.
- `/tts latest` leest het nieuwste assistentantwoord uit het huidige sessietranscript en verstuurt het eenmaal als audio. Het slaat alleen een hash van dat antwoord op in de sessie-entry om dubbele stemverzendingen te onderdrukken.
- `/tts audio` genereert een eenmalig audioantwoord (schakelt TTS **niet** in).
- `limit` en `summary` worden opgeslagen in **lokale voorkeuren**, niet in de hoofdconfiguratie.
- `/tts status` bevat fallbackdiagnostiek voor de nieuwste poging — `Fallback: <primary> -> <used>`, `Attempts: ...` en details per poging (`provider:outcome(reasonCode) latency`).
- `/status` toont de actieve TTS-modus plus geconfigureerde provider, model, stem en opgeschoonde aangepaste eindpuntmetadata wanneer TTS is ingeschakeld.

## Voorkeuren per gebruiker

Slash-commando's schrijven lokale overschrijvingen naar `prefsPath`. De standaardwaarde is
`~/.openclaw/settings/tts.json`; overschrijf met de env-var `OPENCLAW_TTS_PREFS`
of `messages.tts.prefsPath`.

| Opgeslagen veld | Effect                                       |
| ------------ | -------------------------------------------- |
| `auto`       | Lokale auto-TTS-overschrijving (`always`, `off`, …) |
| `provider`   | Lokale primaire provideroverride              |
| `persona`    | Lokale personaoverride                       |
| `maxLength`  | Samenvattingsdrempel (standaard `1500` tekens)     |
| `summarize`  | Samenvattingsschakelaar (standaard `true`)              |

Deze overschrijven de effectieve configuratie uit `messages.tts` plus het actieve
`agents.list[].tts`-blok voor die host.

## Uitvoerformaten (vast)

TTS-stemlevering wordt aangestuurd door kanaalmogelijkheden. Kanaalplugins adverteren
of TTS in stemstijl providers moet vragen om een native `voice-note`-doel of
normale `audio-file`-synthese moet behouden en compatibele uitvoer alleen voor stemlevering moet markeren.

- **Kanalen met spraaknotitiemogelijkheid**: spraaknotitie-antwoorden geven de voorkeur aan Opus (`opus_48000_64` van ElevenLabs, `opus` van OpenAI).
  - 48 kHz / 64 kbps is een goede afweging voor spraakberichten.
- **Feishu / WhatsApp**: wanneer een spraaknotitie-antwoord wordt geproduceerd als MP3/WebM/WAV/M4A
  of een ander waarschijnlijk audiobestand, zet de kanaalplugin dit met `ffmpeg` om naar 48 kHz
  Ogg/Opus voordat het native spraakbericht wordt verzonden. WhatsApp verzendt
  het resultaat via de Baileys-`audio`-payload met `ptt: true` en
  `audio/ogg; codecs=opus`. Als conversie mislukt, ontvangt Feishu het oorspronkelijke
  bestand als bijlage; verzenden via WhatsApp mislukt in plaats van een incompatibele
  PTT-payload te plaatsen.
- **BlueBubbles**: houdt providersynthese op het normale audiobestandspad; MP3-
  en CAF-uitvoer wordt gemarkeerd voor levering als iMessage-spraakmemo.
- **Andere kanalen**: MP3 (`mp3_44100_128` van ElevenLabs, `mp3` van OpenAI).
  - 44,1 kHz / 128 kbps is de standaardbalans voor spraakhelderheid.
- **MiniMax**: MP3 (`speech-2.8-hd`-model, 32 kHz samplefrequentie) voor normale audiobijlagen. Voor door kanalen aangekondigde spraaknotitiedoelen zet OpenClaw de MiniMax-MP3 vóór levering om naar 48 kHz Opus met `ffmpeg` wanneer het kanaal transcodering aankondigt.
- **Xiaomi MiMo**: standaard MP3, of WAV wanneer geconfigureerd. Voor door kanalen aangekondigde spraaknotitiedoelen zet OpenClaw Xiaomi-uitvoer vóór levering om naar 48 kHz Opus met `ffmpeg` wanneer het kanaal transcodering aankondigt.
- **Lokale CLI**: gebruikt de geconfigureerde `outputFormat`. Spraaknotitiedoelen worden
  geconverteerd naar Ogg/Opus en telefonie-uitvoer wordt geconverteerd naar ruwe 16 kHz mono PCM
  met `ffmpeg`.
- **Google Gemini**: Gemini API TTS retourneert ruwe 24 kHz PCM. OpenClaw verpakt dit als WAV voor audiobijlagen, transcodeert het naar 48 kHz Opus voor spraaknotitiedoelen en retourneert PCM rechtstreeks voor Talk/telefonie.
- **Gradium**: WAV voor audiobijlagen, Opus voor spraaknotitiedoelen en `ulaw_8000` op 8 kHz voor telefonie.
- **Inworld**: MP3 voor normale audiobijlagen, native `OGG_OPUS` voor spraaknotitiedoelen en ruwe `PCM` op 22050 Hz voor Talk/telefonie.
- **xAI**: standaard MP3; `responseFormat` kan `mp3`, `wav`, `pcm`, `mulaw` of `alaw` zijn. OpenClaw gebruikt xAI's batch-REST-TTS-eindpunt en retourneert een volledige audiobijlage; xAI's streaming-TTS-WebSocket wordt niet gebruikt door dit providerpad. Native Opus-spraaknotitieformaat wordt niet ondersteund door dit pad.
- **Microsoft**: gebruikt `microsoft.outputFormat` (standaard `audio-24khz-48kbitrate-mono-mp3`).
  - Het meegeleverde transport accepteert een `outputFormat`, maar niet alle formaten zijn beschikbaar vanuit de service.
  - Uitvoerformatwaarden volgen Microsoft Speech-uitvoerformaten (inclusief Ogg/WebM Opus).
  - Telegram `sendVoice` accepteert OGG/MP3/M4A; gebruik OpenAI/ElevenLabs als je
    gegarandeerde Opus-spraakberichten nodig hebt.
  - Als het geconfigureerde Microsoft-uitvoerformaat mislukt, probeert OpenClaw het opnieuw met MP3.

OpenAI/ElevenLabs-uitvoerformaten zijn per kanaal vast (zie hierboven).

## Auto-TTS-gedrag

Wanneer `messages.tts.auto` is ingeschakeld, doet OpenClaw het volgende:

- Slaat TTS over als het antwoord al media of een `MEDIA:`-directive bevat.
- Slaat zeer korte antwoorden over (minder dan 10 tekens).
- Vat lange antwoorden samen wanneer samenvattingen zijn ingeschakeld, met
  `summaryModel` (of `agents.defaults.model.primary`).
- Voegt de gegenereerde audio toe aan het antwoord.
- In `mode: "final"` wordt nog steeds audio-only TTS verzonden voor gestreamde eindantwoorden
  nadat de tekststream is voltooid; de gegenereerde media doorloopt dezelfde
  kanaalmedianormalisatie als normale antwoordbijlagen.

Als het antwoord langer is dan `maxLength` en samenvatting uit staat (of er geen API-sleutel is voor het
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

## Uitvoerformaten per kanaal

| Doel                                  | Formaat                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Spraaknotitie-antwoorden geven de voorkeur aan **Opus** (`opus_48000_64` van ElevenLabs, `opus` van OpenAI). 48 kHz / 64 kbps brengt helderheid en grootte in balans. |
| Andere kanalen                        | **MP3** (`mp3_44100_128` van ElevenLabs, `mp3` van OpenAI). 44,1 kHz / 128 kbps is standaard voor spraak.                             |
| Talk / telefonie                      | Provider-native **PCM** (Inworld 22050 Hz, Google 24 kHz), of `ulaw_8000` van Gradium voor telefonie.                                 |

Opmerkingen per provider:

- **Feishu / WhatsApp-transcodering:** Wanneer een spraaknotitie-antwoord binnenkomt als MP3/WebM/WAV/M4A, zet de kanaalplugin dit met `ffmpeg` om naar 48 kHz Ogg/Opus. WhatsApp verzendt via Baileys met `ptt: true` en `audio/ogg; codecs=opus`. Als conversie mislukt: Feishu valt terug op het bijvoegen van het oorspronkelijke bestand; WhatsApp-verzending mislukt in plaats van een incompatibele PTT-payload te plaatsen.
- **MiniMax / Xiaomi MiMo:** Standaard MP3 (32 kHz voor MiniMax `speech-2.8-hd`); getranscodeerd naar 48 kHz Opus voor spraaknotitiedoelen via `ffmpeg`.
- **Lokale CLI:** Gebruikt geconfigureerde `outputFormat`. Spraaknotitiedoelen worden geconverteerd naar Ogg/Opus en telefonie-uitvoer naar ruwe 16 kHz mono PCM.
- **Google Gemini:** Retourneert ruwe 24 kHz PCM. OpenClaw verpakt dit als WAV voor bijlagen, transcodeert naar 48 kHz Opus voor spraaknotitiedoelen en retourneert PCM rechtstreeks voor Talk/telefonie.
- **Inworld:** MP3-bijlagen, native `OGG_OPUS`-spraaknotitie, ruwe `PCM` 22050 Hz voor Talk/telefonie.
- **xAI:** Standaard MP3; `responseFormat` kan `mp3|wav|pcm|mulaw|alaw` zijn. Gebruikt xAI's batch-REST-eindpunt — streaming WebSocket TTS wordt **niet** gebruikt. Native Opus-spraaknotitieformaat wordt **niet** ondersteund.
- **Microsoft:** Gebruikt `microsoft.outputFormat` (standaard `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accepteert OGG/MP3/M4A; gebruik OpenAI/ElevenLabs als je gegarandeerde Opus-spraakberichten nodig hebt. Als het geconfigureerde Microsoft-formaat mislukt, probeert OpenClaw het opnieuw met MP3.

OpenAI- en ElevenLabs-uitvoerformaten zijn per kanaal vast zoals hierboven vermeld.

## Veldreferentie

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS-modus. `inbound` verzendt alleen audio na een inkomend spraakbericht; `tagged` verzendt alleen audio wanneer het antwoord `[[tts:...]]`-directives of een `[[tts:text]]`-blok bevat.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Verouderde schakelaar. `openclaw doctor --fix` migreert dit naar `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` omvat tool-/blokantwoorden naast eindantwoorden.
    </ParamField>
    <ParamField path="provider" type="string">
      Spraakprovider-id. Wanneer niet ingesteld, gebruikt OpenClaw de eerste geconfigureerde provider in de automatische selecteerorde van het register. Verouderde `provider: "edge"` wordt door `openclaw doctor --fix` herschreven naar `"microsoft"`.
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
      Staat toe dat het model TTS-directives uitzendt. `enabled` is standaard `true`; `allowProvider` is standaard `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Provider-eigen instellingen gesleuteld op spraakprovider-id. Verouderde directe blokken (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) worden herschreven door `openclaw doctor --fix`; commit alleen `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Harde limiet voor TTS-invoertekens. `/tts audio` mislukt als deze wordt overschreden.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Aanvraag-time-out in milliseconden.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Overschrijft het lokale prefs-JSON-pad (provider/limiet/samenvatting). Standaard `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, of `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech-regio (bijv. `eastus`). Env: `AZURE_SPEECH_REGION` of `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Optionele overschrijving van Azure Speech-eindpunt (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure-stem-ShortName. Standaard `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">SSML-taalcode. Standaard `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` voor standaardaudio. Standaard `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` voor spraaknotitie-uitvoer. Standaard `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Valt terug op `ELEVENLABS_API_KEY` of `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Model-id (bijv. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs-stem-id.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (elk `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normaal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Tekstnormalisatiemodus.</ParamField>
    <ParamField path="languageCode" type="string">2-letterige ISO 639-1 (bijv. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Geheel getal `0..4294967295` voor best-effort-determinisme.</ParamField>
    <ParamField path="baseUrl" type="string">Overschrijf de basis-URL van de ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Valt terug op `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Indien weggelaten, kan TTS `models.providers.google.apiKey` hergebruiken vóór env-terugval.</ParamField>
    <ParamField path="model" type="string">Gemini TTS-model. Standaard `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Gemini-naam van vooraf gebouwde stem. Standaard `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt in natuurlijke taal voor stijl, toegevoegd vóór gesproken tekst.</ParamField>
    <ParamField path="speakerName" type="string">Optioneel sprekerlabel, toegevoegd vóór gesproken tekst wanneer je prompt een benoemde spreker gebruikt.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Stel in op `audio-profile-v1` om actieve persona-promptvelden te verpakken in een deterministische Gemini TTS-promptstructuur.</ParamField>
    <ParamField path="personaPrompt" type="string">Google-specifieke extra persona-prompttekst, toegevoegd aan de Director's Notes van de template.</ParamField>
    <ParamField path="baseUrl" type="string">Alleen `https://generativelanguage.googleapis.com` wordt geaccepteerd.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Omgeving: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Omgeving: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Standaard `inworld-tts-1.5-max`. Ook: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Samplingtemperatuur `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokaal uitvoerbaar bestand of commandoreeks voor CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Commandoargumenten. Ondersteunt de placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Verwachte CLI-uitvoerindeling. Standaard `mp3` voor audiobijlagen.</ParamField>
    <ParamField path="timeoutMs" type="number">Commandotime-out in milliseconden. Standaard `120000`.</ParamField>
    <ParamField path="cwd" type="string">Optionele werkmap voor het commando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Optionele omgevingsoverschrijvingen voor het commando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Sta Microsoft-spraakgebruik toe.</ParamField>
    <ParamField path="voice" type="string">Naam van Microsoft-neurale stem (bijv. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Taalcode (bijv. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft-uitvoerindeling. Standaard `audio-24khz-48kbitrate-mono-mp3`. Niet alle indelingen worden ondersteund door het meegeleverde Edge-gebaseerde transport.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Percentagereeksen (bijv. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Schrijf JSON-ondertitels naast het audiobestand.</ParamField>
    <ParamField path="proxy" type="string">Proxy-URL voor Microsoft-spraakverzoeken.</ParamField>
    <ParamField path="timeoutMs" type="number">Overschrijving van aanvraagtime-out (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Verouderde alias. Voer `openclaw doctor --fix` uit om opgeslagen configuratie te herschrijven naar `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Valt terug op `MINIMAX_API_KEY`. Token Plan-authenticatie via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` of `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.minimax.io`. Omgeving: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Standaard `speech-2.8-hd`. Omgeving: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard `English_expressive_narrator`. Omgeving: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Standaard `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Standaard `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Geheel getal `-12..12`. Standaard `0`. Fractionele waarden worden vóór de aanvraag afgekapt.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Valt terug op `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS-model-id (bijv. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Stemnaam (bijv. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Expliciet OpenAI-veld `instructions`. Wanneer dit is ingesteld, worden persona-promptvelden **niet** automatisch gemapt.</ParamField>
    <ParamField path="baseUrl" type="string">
      Overschrijf het OpenAI TTS-eindpunt. Resolutievolgorde: configuratie → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Niet-standaardwaarden worden behandeld als OpenAI-compatibele TTS-eindpunten, dus aangepaste model- en stemnamen worden geaccepteerd.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Omgeving: `OPENROUTER_API_KEY`. Kan `models.providers.openrouter.apiKey` hergebruiken.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://openrouter.ai/api/v1`. Verouderde `https://openrouter.ai/v1` wordt genormaliseerd.</ParamField>
    <ParamField path="model" type="string">Standaard `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Standaard `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Standaard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native snelheidsoverschrijving.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Omgeving: `VOLCENGINE_TTS_API_KEY` of `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Standaard `seed-tts-1.0`. Omgeving: `VOLCENGINE_TTS_RESOURCE_ID`. Gebruik `seed-tts-2.0` wanneer je project recht heeft op TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">App-sleutelheader. Standaard `aGjiRDfUWi`. Omgeving: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Overschrijf het Seed Speech TTS HTTP-eindpunt. Omgeving: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Stemtype. Standaard `en_female_anna_mars_bigtts`. Omgeving: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Provider-native snelheidsverhouding.</ParamField>
    <ParamField path="emotion" type="string">Provider-native emotietag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Verouderde Volcengine Speech Console-velden. Omgeving: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (standaard `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Omgeving: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.x.ai/v1`. Omgeving: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Standaard `eve`. Live stemmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">BCP-47-taalcode of `auto`. Standaard `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Standaard `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native snelheidsoverschrijving.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Omgeving: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Standaard `https://api.xiaomimimo.com/v1`. Omgeving: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Standaard `mimo-v2.5-tts`. Omgeving: `XIAOMI_TTS_MODEL`. Ondersteunt ook `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Standaard `mimo_default`. Omgeving: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Standaard `mp3`. Omgeving: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Optionele stijlinstructie in natuurlijke taal die als gebruikersbericht wordt verzonden; wordt niet uitgesproken.</ParamField>
  </Accordion>
</AccordionGroup>

## Agent-tool

De tool `tts` zet tekst om naar spraak en retourneert een audiobijlage voor
antwoordlevering. Op Feishu, Matrix, Telegram en WhatsApp wordt de audio
geleverd als spraakbericht in plaats van als bestandsbijlage. Feishu en
WhatsApp kunnen niet-Opus TTS-uitvoer op dit pad transcoderen wanneer `ffmpeg`
beschikbaar is.

WhatsApp verzendt audio via Baileys als een PTT-spraaknotitie (`audio` met
`ptt: true`) en verzendt zichtbare tekst **apart** van PTT-audio, omdat
clients bijschriften op spraaknotities niet consistent weergeven.

De tool accepteert optionele velden `channel` en `timeoutMs`; `timeoutMs` is een
provider-aanvraagtime-out per aanroep in milliseconden.

## Gateway-RPC

| Methode           | Doel                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Lees huidige TTS-status en laatste poging. |
| `tts.enable`      | Stel lokale automatische voorkeur in op `always`. |
| `tts.disable`     | Stel lokale automatische voorkeur in op `off`. |
| `tts.convert`     | Eenmalige tekst → audio.                 |
| `tts.setProvider` | Stel lokale providervoorkeur in.         |
| `tts.setPersona`  | Stel lokale personavoorkeur in.          |
| `tts.providers`   | Toon geconfigureerde providers en status. |

## Servicelinks

- [OpenAI-gids voor tekst-naar-spraak](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API-referentie](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST tekst-naar-spraak](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech-provider](/nl/providers/azure-speech)
- [ElevenLabs Tekst naar spraak](https://elevenlabs.io/docs/api-reference/text-to-speech)
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
- [Slash-commando's](/nl/tools/slash-commands)
- [Spraakoproep-Plugin](/nl/plugins/voice-call)
