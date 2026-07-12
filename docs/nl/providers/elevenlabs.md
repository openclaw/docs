---
read_when:
    - Je wilt tekst-naar-spraak van ElevenLabs in OpenClaw
    - Je wilt ElevenLabs Scribe-spraak-naar-tekst gebruiken voor audiobijlagen
    - Je wilt realtime transcriptie van ElevenLabs voor Voice Call of Google Meet
summary: Gebruik ElevenLabs-spraak, Scribe STT en realtime transcriptie met OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T09:18:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw gebruikt ElevenLabs voor tekst-naar-spraak, batchgewijze spraak-naar-tekst met Scribe
v2 en streaming-STT met Scribe v2 Realtime. De Plugin wordt meegeleverd en is
standaard ingeschakeld; een stap met `plugins install` is niet nodig.

| Mogelijkheid                     | OpenClaw-oppervlak                                                    | Standaard                |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Tekst-naar-spraak                | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Batchgewijze spraak-naar-tekst   | `tools.media.audio`                                                   | `scribe_v2`              |
| Streaming-spraak-naar-tekst      | Voice Call-streaming of Google Meet `realtime.transcriptionProvider`  | `scribe_v2_realtime`     |

## Authenticatie

Stel `ELEVENLABS_API_KEY` in de omgeving in. `XI_API_KEY` wordt ook geaccepteerd voor
compatibiliteit met bestaande ElevenLabs-hulpmiddelen.

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

Discord-spraakkanalen gebruiken het streaming-TTS-eindpunt van ElevenLabs wanneer ElevenLabs
de geselecteerde provider voor `voice.tts`/`messages.tts` is: het afspelen begint vanuit de
geretourneerde audiostream, in plaats van te wachten totdat OpenClaw eerst het volledige
audiobestand heeft gedownload. `latencyTier` wordt toegewezen aan de queryparameter
`optimize_streaming_latency` van ElevenLabs voor modellen die deze accepteren; OpenClaw laat
die parameter weg voor `eleven_v3`, omdat dit model deze afwijst.

## Spraak-naar-tekst

Gebruik Scribe v2 voor inkomende audiobijlagen en korte opgenomen spraakfragmenten:

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

OpenClaw verzendt meerdelige audio naar ElevenLabs `/v1/speech-to-text` met
`model_id: "scribe_v2"`. Taalaanwijzingen worden, indien aanwezig, toegewezen aan `language_code`.

## Streaming-STT

De meegeleverde `elevenlabs`-Plugin registreert Scribe v2 Realtime voor Voice Call en
streamingtranscriptie in agentmodus voor Google Meet.

| Instelling       | Configuratiepad                                                            | Standaard                                             |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| API-sleutel      | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`   | Valt terug op `ELEVENLABS_API_KEY` / `XI_API_KEY`     |
| Model            | `...elevenlabs.modelId`                                                     | `scribe_v2_realtime`                                  |
| Audio-indeling   | `...elevenlabs.audioFormat`                                                 | `ulaw_8000`                                           |
| Bemonsteringsfrequentie | `...elevenlabs.sampleRate`                                           | `8000`                                                |
| Vastlegstrategie | `...elevenlabs.commitStrategy`                                              | `vad`                                                 |
| Taal             | `...elevenlabs.languageCode`                                                | (niet ingesteld)                                      |

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
gebruikt standaard `ulaw_8000`, zodat telefonieframes zonder transcodering kunnen worden
doorgestuurd.
</Note>

Stel voor de agentmodus van Google Meet
`plugins.entries.google-meet.config.realtime.transcriptionProvider` in op
`"elevenlabs"` en configureer hetzelfde providerblok onder
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Google Meet](/nl/plugins/google-meet)
- [Modelselectie](/nl/concepts/model-providers)
