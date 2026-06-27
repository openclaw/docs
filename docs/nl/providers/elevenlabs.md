---
read_when:
    - Je wilt ElevenLabs-tekst-naar-spraak in OpenClaw
    - Je wilt ElevenLabs Scribe-spraak-naar-tekst voor audiobijlagen
    - Je wilt ElevenLabs-realtime-transcriptie voor Voice Call of Google Meet
summary: Gebruik ElevenLabs-spraak, Scribe-STT en realtime transcriptie met OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:11:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw gebruikt ElevenLabs voor tekst-naar-spraak, batchgewijze spraak-naar-tekst met Scribe
v2, en streaming-STT met Scribe v2 Realtime.

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
de geselecteerde `voice.tts`/`messages.tts`-provider is. Afspelen start vanaf de
geretourneerde audiostream in plaats van te wachten tot OpenClaw eerst het
volledige audiobestand heeft gedownload en weggeschreven. `latencyTier` wordt toegewezen aan de
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
`model_id: "scribe_v2"`. Taalhints worden toegewezen aan `language_code` wanneer aanwezig.

## Streaming-STT

De gebundelde `elevenlabs`-plugin registreert Scribe v2 Realtime voor Voice Call en
Google Meet-streamingtranscriptie in agentmodus.

| Instelling      | Configuratiepad                                                          | Standaard                                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API-sleutel     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Valt terug op `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Audio-indeling  | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Samplefrequentie | `...elevenlabs.sampleRate`                                               | `8000`                                            |
| Commit-strategie | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
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
Voice Call ontvangt Twilio-media als 8 kHz G.711 u-law. De realtime-provider van ElevenLabs
gebruikt standaard `ulaw_8000`, zodat telefonieframes kunnen worden doorgestuurd zonder
transcodering.
</Note>

Voor Google Meet-agentmodus stelt u
`plugins.entries.google-meet.config.realtime.transcriptionProvider` in op
`"elevenlabs"` en configureert u hetzelfde providerblok onder
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Gerelateerd

- [Tekst-naar-spraak](/nl/tools/tts)
- [Google Meet](/nl/plugins/google-meet)
- [Modelselectie](/nl/concepts/model-providers)
