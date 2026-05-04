---
read_when:
    - Sie möchten ElevenLabs-Text-to-Speech in OpenClaw verwenden
    - Sie möchten die Spracherkennung von ElevenLabs Scribe für Audioanhänge verwenden
    - Sie möchten ElevenLabs-Echtzeit-Transkription für Sprachanrufe oder Google Meet
summary: ElevenLabs-Sprachausgabe, Scribe-STT und Echtzeittranskription mit OpenClaw verwenden
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T06:43:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw verwendet ElevenLabs für Text-to-Speech, Batch-Speech-to-Text mit Scribe
v2 und Streaming-STT mit Scribe v2 Realtime.

| Fähigkeit               | OpenClaw-Oberfläche                                                 | Standard                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Text-to-Speech           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Batch-Speech-to-Text     | `tools.media.audio`                                                  | `scribe_v2`              |
| Streaming-Speech-to-Text | Voice-Call-Streaming oder Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentifizierung

Setzen Sie `ELEVENLABS_API_KEY` in der Umgebung. `XI_API_KEY` wird ebenfalls für
die Kompatibilität mit vorhandenen ElevenLabs-Tools akzeptiert.

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

Setzen Sie `modelId` auf `eleven_v3`, um ElevenLabs v3 TTS zu verwenden. OpenClaw behält
`eleven_multilingual_v2` als Standard für vorhandene Installationen bei.

## Speech-to-Text

Verwenden Sie Scribe v2 für eingehende Audioanhänge und kurze aufgezeichnete Sprachsegmente:

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
`model_id: "scribe_v2"`. Sprachhinweise werden, sofern vorhanden, `language_code` zugeordnet.

## Streaming-STT

Das gebündelte `elevenlabs`-Plugin registriert Scribe v2 Realtime für Voice Call und
Google Meet-Streaming-Transkription im Agentenmodus.

| Einstellung      | Konfigurationspfad                                                     | Standard                                         |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API-Schlüssel   | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fällt auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell          | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Audioformat     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Abtastrate      | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Commit-Strategie | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Sprache         | `...elevenlabs.languageCode`                                              | (nicht gesetzt)                                   |

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
Voice Call empfängt Twilio-Medien als 8 kHz G.711 u-law. Der ElevenLabs-Realtime-
Provider verwendet standardmäßig `ulaw_8000`, sodass Telefonie-Frames ohne
Transkodierung weitergeleitet werden können.
</Note>

Setzen Sie für den Google Meet-Agentenmodus
`plugins.entries.google-meet.config.realtime.transcriptionProvider` auf
`"elevenlabs"` und konfigurieren Sie denselben Provider-Block unter
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Verwandt

- [Text-to-Speech](/de/tools/tts)
- [Google Meet](/de/plugins/google-meet)
- [Modellauswahl](/de/concepts/model-providers)
