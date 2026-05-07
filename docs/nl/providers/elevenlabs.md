---
read_when:
    - Je wilt tekst-naar-spraak van ElevenLabs in OpenClaw
    - Je wilt ElevenLabs Scribe-spraak-naar-tekst voor audiobijlagen
    - Je wilt ElevenLabs-realtime-transcriptie voor Spraakoproep of Google Meet
summary: Gebruik ElevenLabs-spraak, Scribe STT en realtime-transcriptie met OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw gebruikt ElevenLabs voor tekst-naar-spraak, batchgewijze spraak-naar-tekst met Scribe
v2, en streaming STT met Scribe v2 Realtime.

| Mogelijkheid            | OpenClaw-oppervlak                                                    | Standaard                |
| ----------------------- | --------------------------------------------------------------------- | ------------------------ |
| Tekst-naar-spraak       | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Batchgewijze spraak-naar-tekst | `tools.media.audio`                                           | `scribe_v2`              |
| Streaming spraak-naar-tekst | Voice Call-streaming of Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authenticatie

Stel `ELEVENLABS_API_KEY` in de omgeving in. `XI_API_KEY` wordt ook geaccepteerd voor
compatibiliteit met bestaande ElevenLabs-tools.

```bash
export ELEVENLABS_API_KEY="..."
```

## Tekst-naar-spraak

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Stel `modelId` in op `eleven_v3` om ElevenLabs v3 TTS te gebruiken. OpenClaw behoudt
`eleven_multilingual_v2` als standaard voor bestaande installaties.

Discord-spraakkanalen gebruiken het streaming TTS-eindpunt van ElevenLabs wanneer ElevenLabs
de geselecteerde `voice.tts`/`messages.tts`-provider is. Afspelen begint vanuit de
geretourneerde audiostream in plaats van eerst te wachten tot OpenClaw het volledige
audiobestand heeft gedownload en weggeschreven. `latencyTier` wordt gekoppeld aan de
queryparameter `optimize_streaming_latency` van ElevenLabs voor modellen die deze accepteren; OpenClaw
laat die parameter weg voor `eleven_v3`, dat deze weigert.

## Spraak-naar-tekst

Gebruik Scribe v2 voor inkomende audiobijlagen en korte opgenomen spraaksegmenten:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw stuurt multipart-audio naar ElevenLabs `/v1/speech-to-text` met
`model_id: "scribe_v2"`. Taalhints worden gekoppeld aan `language_code` wanneer aanwezig.

## Streaming STT

De meegeleverde `elevenlabs`-Plugin registreert Scribe v2 Realtime voor Voice Call en
streaming transcriptie in Google Meet-agentmodus.

| Instelling      | Configuratiepad                                                         | Standaard                                         |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| API-sleutel     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Valt terug op `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| Audioformaat    | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Samplefrequentie | `...elevenlabs.sampleRate`                                              | `8000`                                            |
| Commitstrategie | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
| Taal            | `...elevenlabs.languageCode`                                             | (niet ingesteld)                                  |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call ontvangt Twilio-media als 8 kHz G.711 u-law. De realtime
provider van ElevenLabs gebruikt standaard `ulaw_8000`, zodat telefonieframes zonder
transcodering kunnen worden doorgestuurd.
</Note>

Voor de Google Meet-agentmodus stelt u
`plugins.entries.google-meet.config.realtime.transcriptionProvider` in op
`"elevenlabs"` en configureert u hetzelfde providerblok onder
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Google Meet](/nl/plugins/google-meet)
- [Modelselectie](/nl/concepts/model-providers)
