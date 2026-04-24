---
read_when:
    - Vuoi usare text-to-speech ElevenLabs in OpenClaw
    - Vuoi usare speech-to-text ElevenLabs Scribe per allegati audio
    - Vuoi la trascrizione realtime ElevenLabs per Voice Call
summary: Usa speech ElevenLabs, Scribe STT e trascrizione realtime con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T08:56:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw usa ElevenLabs per text-to-speech, speech-to-text batch con Scribe
v2 e STT in streaming per Voice Call con Scribe v2 Realtime.

| Capacità | Superficie OpenClaw | Predefinito |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Text-to-speech | `messages.tts` / `talk` | `eleven_multilingual_v2` |
| Speech-to-text batch | `tools.media.audio` | `scribe_v2` |
| Speech-to-text in streaming | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime` |

## Autenticazione

Imposta `ELEVENLABS_API_KEY` nell'ambiente. Anche `XI_API_KEY` è accettato per
compatibilità con gli strumenti ElevenLabs esistenti.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

## Speech-to-text

Usa Scribe v2 per allegati audio in ingresso e brevi segmenti vocali registrati:

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

OpenClaw invia audio multipart a ElevenLabs `/v1/speech-to-text` con
`model_id: "scribe_v2"`. Gli hint di lingua vengono mappati su `language_code` quando presenti.

## STT in streaming per Voice Call

Il Plugin `elevenlabs` incluso registra Scribe v2 Realtime per la
trascrizione in streaming di Voice Call.

| Impostazione | Percorso di configurazione | Predefinito |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Chiave API | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Usa come fallback `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modello | `...elevenlabs.modelId` | `scribe_v2_realtime` |
| Formato audio | `...elevenlabs.audioFormat` | `ulaw_8000` |
| Frequenza di campionamento | `...elevenlabs.sampleRate` | `8000` |
| Strategia di commit | `...elevenlabs.commitStrategy` | `vad` |
| Lingua | `...elevenlabs.languageCode` | (non impostato) |

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
Voice Call riceve media Twilio come G.711 u-law a 8 kHz. Il provider realtime ElevenLabs
usa per impostazione predefinita `ulaw_8000`, quindi i frame di telefonia possono essere inoltrati senza
transcodifica.
</Note>

## Correlati

- [Text-to-speech](/it/tools/tts)
- [Model selection](/it/concepts/model-providers)
