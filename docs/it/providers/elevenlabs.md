---
read_when:
    - Vuoi usare la sintesi vocale di ElevenLabs in OpenClaw
    - Vuoi usare ElevenLabs Scribe per la trascrizione vocale in testo degli allegati audio
    - Vuoi la trascrizione in tempo reale di ElevenLabs per Chiamata vocale o Google Meet
summary: Usa la sintesi vocale di ElevenLabs, Scribe STT e la trascrizione in tempo reale con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:07:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw usa ElevenLabs per la sintesi vocale, la trascrizione batch da voce a testo con Scribe
v2 e lo STT in streaming con Scribe v2 Realtime.

| Funzionalità             | Superficie OpenClaw                                                   | Predefinito              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Sintesi vocale           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Voce-testo batch         | `tools.media.audio`                                                  | `scribe_v2`              |
| Voce-testo in streaming  | Streaming di Voice Call o Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Autenticazione

Imposta `ELEVENLABS_API_KEY` nell'ambiente. `XI_API_KEY` è accettata anche per
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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Imposta `modelId` su `eleven_v3` per usare ElevenLabs v3 TTS. OpenClaw mantiene
`eleven_multilingual_v2` come predefinito per le installazioni esistenti.

I canali vocali Discord usano l'endpoint TTS in streaming di ElevenLabs quando
ElevenLabs è il provider `voice.tts`/`messages.tts` selezionato. La riproduzione
inizia dallo stream audio restituito invece di attendere che OpenClaw scarichi e
scriva prima l'intero file audio. `latencyTier` viene mappato al parametro di
query `optimize_streaming_latency` di ElevenLabs per i modelli che lo accettano;
OpenClaw omette quel parametro per `eleven_v3`, che lo rifiuta.

## Trascrizione voce-testo

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
| Chiave API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Ripiega su `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Modello           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato audio     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Frequenza di campionamento | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategia di commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Lingua            | `...elevenlabs.languageCode`                                              | (non impostato)                                   |

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
di ElevenLabs usa come predefinito `ulaw_8000`, quindi i frame di telefonia possono essere inoltrati senza
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
