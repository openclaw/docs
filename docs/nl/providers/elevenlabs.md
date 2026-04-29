---
read_when:
    - Je wilt ElevenLabs-tekst-naar-spraak in OpenClaw
    - Je wilt ElevenLabs Scribe-spraak-naar-tekst voor audiobijlagen
    - Je wilt realtime transcriptie van ElevenLabs voor Spraakoproep
summary: Gebruik ElevenLabs-spraak, Scribe STT en realtime-transcriptie met OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-29T23:10:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw gebruikt ElevenLabs voor tekst-naar-spraak, batchgewijze spraak-naar-tekst met Scribe
v2, en Voice Call-streaming-STT met Scribe v2 Realtime.

| Mogelijkheid            | OpenClaw-oppervlak                            | Standaard                |
| ----------------------- | --------------------------------------------- | ------------------------ |
| Tekst-naar-spraak       | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Batchgewijze spraak-naar-tekst | `tools.media.audio`                           | `scribe_v2`              |
| Streaming spraak-naar-tekst | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Authenticatie

Stel `ELEVENLABS_API_KEY` in de omgeving in. `XI_API_KEY` wordt ook geaccepteerd voor
compatibiliteit met bestaande ElevenLabs-tooling.

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

## Spraak-naar-tekst

Gebruik Scribe v2 voor binnenkomende audiobijlagen en korte opgenomen spraaksegmenten:

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

## Voice Call-streaming-STT

De meegeleverde `elevenlabs` Plugin registreert Scribe v2 Realtime voor Voice Call-
streamingtranscriptie.

| Instelling      | Configuratiepad                                                           | Standaard                                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API-sleutel     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Valt terug op `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Audio-indeling  | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Samplefrequentie | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Commitstrategie | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Taal            | `...elevenlabs.languageCode`                                              | (niet ingesteld)                                  |

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
Voice Call ontvangt Twilio-media als 8 kHz G.711 u-law. De realtimeprovider van ElevenLabs
gebruikt standaard `ulaw_8000`, zodat telefonieframes kunnen worden doorgestuurd zonder
transcodering.
</Note>

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Modelselectie](/nl/concepts/model-providers)
