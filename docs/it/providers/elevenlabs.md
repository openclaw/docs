---
read_when:
    - Vuoi usare la sintesi vocale ElevenLabs in OpenClaw
    - Vuoi usare ElevenLabs Scribe speech-to-text per allegati audio
    - Vuoi usare la trascrizione in tempo reale ElevenLabs per Voice Call
summary: Usare ElevenLabs Speech, Scribe STT e la trascrizione in tempo reale con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T08:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw usa ElevenLabs per text-to-speech, speech-to-text batch con Scribe
v2 e streaming STT di Voice Call con Scribe v2 Realtime.

| Capability               | Superficie OpenClaw                             | Predefinito               |
| ------------------------ | ----------------------------------------------- | ------------------------- |
| Text-to-speech           | `messages.tts` / `talk`                         | `eleven_multilingual_v2`  |
| Speech-to-text batch     | `tools.media.audio`                             | `scribe_v2`               |
| Streaming speech-to-text | Voice Call `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`      |

## Autenticazione

Imposta `ELEVENLABS_API_KEY` nell'ambiente. Anche `XI_API_KEY` è accettata per
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
`model_id: "scribe_v2"`. Gli hint di lingua vengono mappati a `language_code` quando presenti.

## Streaming STT di Voice Call

Il plugin integrato `elevenlabs` registra Scribe v2 Realtime per la
trascrizione streaming di Voice Call.

| Impostazione      | Percorso config                                                           | Predefinito                                        |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| Chiave API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Usa come fallback `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modello           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                               |
| Formato audio     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                        |
| Frequenza campionamento | `...elevenlabs.sampleRate`                                          | `8000`                                             |
| Strategia di commit | `...elevenlabs.commitStrategy`                                          | `vad`                                              |
| Lingua            | `...elevenlabs.languageCode`                                              | (non impostata)                                    |

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
usa come predefinito `ulaw_8000`, quindi i frame telefonici possono essere inoltrati senza
transcoding.
</Note>
