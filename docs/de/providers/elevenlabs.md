---
read_when:
    - Du möchtest ElevenLabs-Text-to-Speech in OpenClaw verwenden
    - Du möchtest ElevenLabs Scribe Speech-to-Text für Audioanhänge verwenden
    - Du möchtest ElevenLabs-Realtime-Transkription für Voice Call verwenden
summary: ElevenLabs-Sprache, Scribe STT und Realtime-Transkription mit OpenClaw verwenden
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-23T06:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62768d0b8a951548be2a5b293a766432f6345087ed145afc942134513dd9618c
    source_path: providers/elevenlabs.md
    workflow: 15
---

# ElevenLabs

OpenClaw verwendet ElevenLabs für Text-to-Speech, Batch-Speech-to-Text mit Scribe
v2 und Voice-Call-Streaming-STT mit Scribe v2 Realtime.

| Funktion                 | OpenClaw-Oberfläche                            | Standard                 |
| ------------------------ | ---------------------------------------------- | ------------------------ |
| Text-to-Speech           | `messages.tts` / `talk`                        | `eleven_multilingual_v2` |
| Batch-Speech-to-Text     | `tools.media.audio`                            | `scribe_v2`              |
| Streaming-Speech-to-Text | Voice Call `streaming.provider: "elevenlabs"`  | `scribe_v2_realtime`     |

## Authentifizierung

Setze `ELEVENLABS_API_KEY` in der Umgebung. `XI_API_KEY` wird ebenfalls akzeptiert für
die Kompatibilität mit vorhandenen ElevenLabs-Tools.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-Speech

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

## Speech-to-Text

Verwende Scribe v2 für eingehende Audioanhänge und kurze aufgezeichnete Sprachsegmente:

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

OpenClaw sendet Multipart-Audio an ElevenLabs `/v1/speech-to-text` mit
`model_id: "scribe_v2"`. Sprachhinweise werden, falls vorhanden, auf `language_code` abgebildet.

## Streaming-STT für Voice Call

Das gebündelte Plugin `elevenlabs` registriert Scribe v2 Realtime für Voice-Call-
Streaming-Transkription.

| Einstellung      | Konfigurationspfad                                                         | Standard                                          |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| API-Key          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`  | Fällt auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell           | `...elevenlabs.modelId`                                                    | `scribe_v2_realtime`                              |
| Audioformat      | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                       |
| Samplerate       | `...elevenlabs.sampleRate`                                                 | `8000`                                            |
| Commit-Strategie | `...elevenlabs.commitStrategy`                                             | `vad`                                             |
| Sprache          | `...elevenlabs.languageCode`                                               | (nicht gesetzt)                                   |

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
Voice Call empfängt Twilio-Medien als 8-kHz-G.711-u-law. Der ElevenLabs-Realtime-
Provider verwendet standardmäßig `ulaw_8000`, sodass Telefonie-Frames ohne
Transkodierung weitergeleitet werden können.
</Note>
