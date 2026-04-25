---
read_when:
    - Sie möchten ElevenLabs-Text-to-Speech in OpenClaw verwenden.
    - Sie möchten ElevenLabs Scribe Speech-to-Text für Audioanhänge verwenden.
    - Sie möchten ElevenLabs-Realtime-Transkription für Voice Call verwenden.
summary: ElevenLabs-Sprache, Scribe STT und Realtime-Transkription mit OpenClaw verwenden
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw verwendet ElevenLabs für Text-to-Speech, Batch-Speech-to-Text mit Scribe
v2 und Voice-Call-Streaming-STT mit Scribe v2 Realtime.

| Fähigkeit                | OpenClaw-Oberfläche                           | Standard                 |
| ------------------------ | --------------------------------------------- | ------------------------ |
| Text-to-Speech           | `messages.tts` / `talk`                       | `eleven_multilingual_v2` |
| Batch-Speech-to-Text     | `tools.media.audio`                           | `scribe_v2`              |
| Streaming-Speech-to-Text | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`     |

## Authentifizierung

Setzen Sie `ELEVENLABS_API_KEY` in der Umgebung. `XI_API_KEY` wird ebenfalls akzeptiert, um
mit bestehendem ElevenLabs-Tooling kompatibel zu bleiben.

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
`eleven_multilingual_v2` als Standard für bestehende Installationen bei.

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
`model_id: "scribe_v2"`. Sprachhinweise werden auf `language_code` abgebildet, wenn vorhanden.

## Voice-Call-Streaming-STT

Das gebündelte Plugin `elevenlabs` registriert Scribe v2 Realtime für die Streaming-
Transkription von Voice Call.

| Einstellung      | Konfigurationspfad                                                          | Standard                                          |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| API key          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`   | Greift auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell           | `...elevenlabs.modelId`                                                     | `scribe_v2_realtime`                              |
| Audioformat      | `...elevenlabs.audioFormat`                                                 | `ulaw_8000`                                       |
| Sample-Rate      | `...elevenlabs.sampleRate`                                                  | `8000`                                            |
| Commit-Strategie | `...elevenlabs.commitStrategy`                                              | `vad`                                             |
| Sprache          | `...elevenlabs.languageCode`                                                | (nicht gesetzt)                                   |

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
Voice Call empfängt Twilio-Medien als 8-kHz-G.711-u-law. Der Realtime-
Provider von ElevenLabs verwendet standardmäßig `ulaw_8000`, sodass Telefonie-Frames ohne
Transkodierung weitergeleitet werden können.
</Note>

## Verwandt

- [Text-to-Speech](/de/tools/tts)
- [Modellauswahl](/de/concepts/model-providers)
