---
read_when:
    - Vuoi usare la sintesi vocale di ElevenLabs in OpenClaw
    - Vuoi usare la trascrizione vocale ElevenLabs Scribe per gli allegati audio
    - Vuoi la trascrizione in tempo reale di ElevenLabs per Voice Call o Google Meet
summary: Usa la sintesi vocale di ElevenLabs, Scribe STT e la trascrizione in tempo reale con OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T07:26:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw usa ElevenLabs per la sintesi vocale, la trascrizione vocale in testo in batch con Scribe
v2 e la trascrizione vocale in testo in streaming con Scribe v2 Realtime. Il Plugin è incluso e
abilitato per impostazione predefinita; non è necessario alcun passaggio `plugins install`.

| Funzionalità                            | Superficie OpenClaw                                                  | Valore predefinito       |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Sintesi vocale                          | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Trascrizione vocale in testo in batch   | `tools.media.audio`                                                  | `scribe_v2`              |
| Trascrizione vocale in testo in streaming | Streaming di Voice Call o `realtime.transcriptionProvider` di Google Meet | `scribe_v2_realtime`     |

## Autenticazione

Imposta `ELEVENLABS_API_KEY` nell'ambiente. È accettata anche `XI_API_KEY` per
garantire la compatibilità con gli strumenti ElevenLabs esistenti.

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

Imposta `modelId` su `eleven_v3` per usare la sintesi vocale ElevenLabs v3. OpenClaw mantiene
`eleven_multilingual_v2` come valore predefinito per le installazioni esistenti.

I canali vocali di Discord usano l'endpoint di sintesi vocale in streaming di ElevenLabs quando
ElevenLabs è il provider `voice.tts`/`messages.tts` selezionato: la riproduzione inizia dal
flusso audio restituito anziché attendere che OpenClaw scarichi prima l'intero
file audio. `latencyTier` corrisponde al parametro di query `optimize_streaming_latency`
di ElevenLabs per i modelli che lo accettano; OpenClaw omette tale parametro per
`eleven_v3`, che lo rifiuta.

## Trascrizione vocale in testo

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

OpenClaw invia audio multipart a `/v1/speech-to-text` di ElevenLabs con
`model_id: "scribe_v2"`. Le indicazioni sulla lingua vengono associate a `language_code`, se presenti.

## Trascrizione vocale in testo in streaming

Il Plugin `elevenlabs` incluso registra Scribe v2 Realtime per Voice Call e
la trascrizione in streaming in modalità agente di Google Meet.

| Impostazione                | Percorso di configurazione                                                | Valore predefinito                                |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Chiave API                  | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Ripiega su `ELEVENLABS_API_KEY` / `XI_API_KEY`    |
| Modello                     | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Formato audio               | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Frequenza di campionamento  | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategia di commit         | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Lingua                      | `...elevenlabs.languageCode`                                              | (non impostata)                                   |

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
Voice Call riceve i contenuti multimediali Twilio come G.711 u-law a 8 kHz. Il provider in tempo reale
di ElevenLabs usa `ulaw_8000` per impostazione predefinita, quindi i frame di telefonia possono essere inoltrati senza
transcodifica.
</Note>

Per la modalità agente di Google Meet, imposta
`plugins.entries.google-meet.config.realtime.transcriptionProvider` su
`"elevenlabs"` e configura lo stesso blocco del provider in
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Contenuti correlati

- [Sintesi vocale](/it/tools/tts)
- [Google Meet](/it/plugins/google-meet)
- [Selezione del modello](/it/concepts/model-providers)
