---
read_when:
    - Sie möchten die Text-zu-Sprache-Funktion von ElevenLabs in OpenClaw verwenden
    - Sie möchten ElevenLabs Scribe zur Umwandlung von Audioanhängen in Text verwenden
    - Sie möchten die Echtzeittranskription von ElevenLabs für Voice Call oder Google Meet verwenden
summary: ElevenLabs-Sprachausgabe, Scribe-STT und Echtzeittranskription mit OpenClaw verwenden
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-24T05:18:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c570aab5fd3ca00e8ded8e3daa143cb199334d507461800ec0b6c1ab0b65c59
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw verwendet ElevenLabs für Text-to-Speech, Batch-Speech-to-Text mit Scribe
v2 und Streaming-STT mit Scribe v2 Realtime. Das Plugin ist im Lieferumfang enthalten und
standardmäßig aktiviert; es ist kein Schritt `plugins install` erforderlich.

| Funktion                 | OpenClaw-Oberfläche                                                  | Standard                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Text-to-Speech           | `tts` / `talk`                                                       | `eleven_multilingual_v2` |
| Batch-Speech-to-Text     | `tools.media.audio`                                                  | `scribe_v2`              |
| Streaming-Speech-to-Text | Voice-Call-Streaming oder Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentifizierung

Legen Sie `ELEVENLABS_API_KEY` in der Umgebung fest. `XI_API_KEY` wird aus
Kompatibilitätsgründen mit bestehenden ElevenLabs-Werkzeugen ebenfalls akzeptiert.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-Speech

```json5
{
  tts: {
    providers: {
      elevenlabs: {
        apiKey: "${ELEVENLABS_API_KEY}",
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Setzen Sie `modelId` auf `eleven_v3`, um ElevenLabs v3 TTS zu verwenden. OpenClaw behält
`eleven_multilingual_v2` als Standard für bestehende Installationen bei.

Discord-Sprachkanäle verwenden den Streaming-TTS-Endpunkt von ElevenLabs, wenn ElevenLabs
als `voice.tts`-/`tts`-Provider ausgewählt ist: Die Wiedergabe beginnt aus dem
zurückgegebenen Audiostream, anstatt darauf zu warten, dass OpenClaw zunächst die gesamte
Audiodatei herunterlädt. `latencyTier` wird dem ElevenLabs-Abfrageparameter `optimize_streaming_latency`
für Modelle zugeordnet, die ihn akzeptieren; OpenClaw lässt diesen Parameter für
`eleven_v3` weg, da dieses Modell ihn ablehnt.

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

OpenClaw sendet Multipart-Audio mit `model_id: "scribe_v2"` an ElevenLabs
`/v1/speech-to-text`. Sprachhinweise werden, sofern vorhanden, `language_code` zugeordnet.

## Streaming-STT

Das im Lieferumfang enthaltene Plugin `elevenlabs` registriert Scribe v2 Realtime für Voice Call und
die Streaming-Transkription im Agentenmodus von Google Meet.

| Einstellung      | Konfigurationspfad                                                       | Standard                                          |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API-Schlüssel    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fällt auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Audioformat      | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Abtastrate       | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Commit-Strategie | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Sprache          | `...elevenlabs.languageCode`                                              | (nicht festgelegt)                                  |

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
Voice Call empfängt Twilio-Medien als G.711 u-law mit 8 kHz. Der ElevenLabs-Realtime-
Provider verwendet standardmäßig `ulaw_8000`, sodass Telefonie-Frames ohne
Transcodierung weitergeleitet werden können.
</Note>

Legen Sie für den Agentenmodus von Google Meet
`plugins.entries.google-meet.config.realtime.transcriptionProvider` auf
`"elevenlabs"` fest und konfigurieren Sie denselben Provider-Block unter
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Verwandte Themen

- [Text-to-Speech](/de/tools/tts)
- [Google Meet](/de/plugins/google-meet)
- [Modellauswahl](/de/concepts/model-providers)
