---
read_when:
    - Sie möchten ElevenLabs-Text-to-Speech in OpenClaw verwenden
    - Sie möchten ElevenLabs Scribe für die Umwandlung von Sprache in Text bei Audioanhängen verwenden
    - Sie möchten die Echtzeit-Transkription von ElevenLabs für Sprachanrufe oder Google Meet nutzen
summary: ElevenLabs-Sprachausgabe, Scribe STT und Echtzeit-Transkription mit OpenClaw verwenden
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:24:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw verwendet ElevenLabs für Text-zu-Sprache, Batch-Spracherkennung mit Scribe
v2 und Streaming-STT mit Scribe v2 Realtime.

| Funktion                    | OpenClaw-Oberfläche                                                 | Standard                 |
| --------------------------- | ------------------------------------------------------------------- | ------------------------ |
| Text-zu-Sprache             | `messages.tts` / `talk`                                             | `eleven_multilingual_v2` |
| Batch-Spracherkennung       | `tools.media.audio`                                                 | `scribe_v2`              |
| Streaming-Spracherkennung   | Voice Call-Streaming oder Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentifizierung

Setzen Sie `ELEVENLABS_API_KEY` in der Umgebung. `XI_API_KEY` wird zur
Kompatibilität mit bestehenden ElevenLabs-Tools ebenfalls akzeptiert.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-zu-Sprache

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

Discord-Sprachkanäle verwenden den Streaming-TTS-Endpunkt von ElevenLabs, wenn ElevenLabs
der ausgewählte `voice.tts`-/`messages.tts`-Provider ist. Die Wiedergabe startet aus dem
zurückgegebenen Audiostream, anstatt zuerst darauf zu warten, dass OpenClaw die gesamte
Audiodatei herunterlädt und schreibt. `latencyTier` wird für Modelle, die dies akzeptieren,
dem ElevenLabs-Abfrageparameter `optimize_streaming_latency` zugeordnet; OpenClaw
lässt diesen Parameter für `eleven_v3` weg, da es ihn ablehnt.

## Sprache-zu-Text

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
Streaming-Transkription im Google Meet-Agentenmodus.

| Einstellung       | Konfigurationspfad                                                       | Standard                                          |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| API-Schlüssel     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fällt auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell            | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| Audioformat       | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Abtastrate        | `...elevenlabs.sampleRate`                                               | `8000`                                            |
| Commit-Strategie  | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
| Sprache           | `...elevenlabs.languageCode`                                             | (nicht gesetzt)                                   |

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

Für den Google Meet-Agentenmodus setzen Sie
`plugins.entries.google-meet.config.realtime.transcriptionProvider` auf
`"elevenlabs"` und konfigurieren denselben Provider-Block unter
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Verwandte Themen

- [Text-zu-Sprache](/de/tools/tts)
- [Google Meet](/de/plugins/google-meet)
- [Modellauswahl](/de/concepts/model-providers)
