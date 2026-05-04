---
read_when:
    - Vuoi la sintesi vocale di ElevenLabs in OpenClaw
    - Vuoi usare ElevenLabs Scribe per la trascrizione da voce a testo degli allegati audio
    - Vuoi la trascrizione in tempo reale di ElevenLabs per Chiamata vocale o Google Meet
summary: Usa la voce ElevenLabs, Scribe STT e la trascrizione in tempo reale con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:07:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw usa ElevenLabs per la sintesi vocale, la trascrizione audio batch con Scribe
v2 e l'STT in streaming con Scribe v2 Realtime.

| Funzionalità             | Superficie OpenClaw                                                   | Predefinito              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Sintesi vocale           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Trascrizione audio batch | `tools.media.audio`                                                  | `scribe_v2`              |
| STT in streaming         | Streaming di Voice Call o Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Autenticazione

Imposta `ELEVENLABS_API_KEY` nell'ambiente. Anche `XI_API_KEY` è accettata per
compatibilità con gli strumenti ElevenLabs esistenti.

```bash
export ELEVENLABS_API_KEY="..."
```

## Sintesi vocale

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

Imposta `modelId` su `eleven_v3` per usare ElevenLabs v3 TTS. OpenClaw mantiene
`eleven_multilingual_v2` come predefinito per le installazioni esistenti.

## Trascrizione audio

Usa Scribe v2 per gli allegati audio in ingresso e i brevi segmenti vocali registrati:

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
`model_id: "scribe_v2"`. I suggerimenti sulla lingua vengono mappati a `language_code` quando presenti.

## STT in streaming

Il Plugin `elevenlabs` incluso registra Scribe v2 Realtime per Voice Call e
la trascrizione in streaming in modalità agente di Google Meet.

| Impostazione       | Percorso di configurazione                                              | Predefinito                                      |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Chiave API      | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Ripiega su `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modello         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato audio   | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Frequenza di campionamento | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategia di commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Lingua          | `...elevenlabs.languageCode`                                              | (non impostato)                                           |

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
Voice Call riceve i media Twilio come G.711 u-law a 8 kHz. Il provider realtime
ElevenLabs usa come predefinito `ulaw_8000`, quindi i frame telefonici possono essere inoltrati senza
transcodifica.
</Note>

Per la modalità agente di Google Meet, imposta
`plugins.entries.google-meet.config.realtime.transcriptionProvider` su
`"elevenlabs"` e configura lo stesso blocco provider sotto
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Correlati

- [Sintesi vocale](/it/tools/tts)
- [Google Meet](/it/plugins/google-meet)
- [Selezione del modello](/it/concepts/model-providers)
