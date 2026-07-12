---
read_when:
    - Sie möchten die Text-zu-Sprache-Funktion von ElevenLabs in OpenClaw verwenden
    - Sie möchten ElevenLabs Scribe zur Umwandlung von Sprache in Text für Audioanhänge verwenden
    - Sie möchten die Echtzeittranskription von ElevenLabs für Voice Call oder Google Meet verwenden
summary: Verwenden Sie ElevenLabs-Sprachausgabe, Scribe STT und Echtzeittranskription mit OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T02:04:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw verwendet ElevenLabs für Text-zu-Sprache, für die gebündelte Sprache-zu-Text-Verarbeitung mit Scribe
v2 und für Streaming-STT mit Scribe v2 Realtime. Das Plugin ist im Lieferumfang enthalten und
standardmäßig aktiviert; ein Schritt `plugins install` ist nicht erforderlich.

| Funktion                   | OpenClaw-Oberfläche                                                  | Standard                 |
| -------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Text-zu-Sprache            | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Gebündelte Sprache-zu-Text-Verarbeitung | `tools.media.audio`                                      | `scribe_v2`              |
| Streaming-Sprache-zu-Text  | Voice-Call-Streaming oder Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentifizierung

Legen Sie `ELEVENLABS_API_KEY` in der Umgebung fest. `XI_API_KEY` wird ebenfalls
zur Kompatibilität mit vorhandenen ElevenLabs-Werkzeugen akzeptiert.

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

Legen Sie `modelId` auf `eleven_v3` fest, um ElevenLabs v3 TTS zu verwenden. OpenClaw behält
`eleven_multilingual_v2` für vorhandene Installationen als Standard bei.

Discord-Sprachkanäle verwenden den Streaming-TTS-Endpunkt von ElevenLabs, wenn ElevenLabs
als `voice.tts`-/`messages.tts`-Provider ausgewählt ist: Die Wiedergabe beginnt direkt aus dem
zurückgegebenen Audiostream, statt darauf zu warten, dass OpenClaw zunächst die gesamte
Audiodatei herunterlädt. `latencyTier` wird für Modelle, die diesen Parameter unterstützen, dem
Abfrageparameter `optimize_streaming_latency` von ElevenLabs zugeordnet; bei
`eleven_v3` lässt OpenClaw diesen Parameter weg, da das Modell ihn ablehnt.

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

OpenClaw sendet Multipart-Audiodaten mit `model_id: "scribe_v2"` an
ElevenLabs `/v1/speech-to-text`. Sprachhinweise werden, sofern vorhanden,
`language_code` zugeordnet.

## Streaming-STT

Das gebündelte `elevenlabs`-Plugin registriert Scribe v2 Realtime für Voice Call und
die Streaming-Transkription im Agentenmodus von Google Meet.

| Einstellung       | Konfigurationspfad                                                       | Standard                                           |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| API-Schlüssel     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fällt auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell            | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                               |
| Audioformat       | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                        |
| Abtastrate        | `...elevenlabs.sampleRate`                                               | `8000`                                             |
| Commit-Strategie  | `...elevenlabs.commitStrategy`                                           | `vad`                                              |
| Sprache           | `...elevenlabs.languageCode`                                             | (nicht festgelegt)                                 |

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
Voice Call empfängt Twilio-Mediendaten als 8 kHz G.711 μ-Law. Der ElevenLabs-Realtime-
Provider verwendet standardmäßig `ulaw_8000`, sodass Telefonie-Frames ohne
Transkodierung weitergeleitet werden können.
</Note>

Legen Sie für den Agentenmodus von Google Meet
`plugins.entries.google-meet.config.realtime.transcriptionProvider` auf
`"elevenlabs"` fest und konfigurieren Sie denselben Provider-Block unter
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Verwandte Themen

- [Text-zu-Sprache](/de/tools/tts)
- [Google Meet](/de/plugins/google-meet)
- [Modellauswahl](/de/concepts/model-providers)
