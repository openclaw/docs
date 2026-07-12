---
read_when:
    - Sie möchten die Text-zu-Sprache-Funktion von ElevenLabs in OpenClaw verwenden
    - Sie möchten ElevenLabs Scribe zur Umwandlung von Audioanhängen in Text verwenden
    - Sie möchten die Echtzeit-Transkription von ElevenLabs für Voice Call oder Google Meet verwenden
summary: Verwenden Sie ElevenLabs-Sprachausgabe, Scribe-STT und Echtzeittranskription mit OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T15:47:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw verwendet ElevenLabs für Text-zu-Sprache, die batchweise Sprache-zu-Text-Umwandlung mit Scribe
v2 und Streaming-STT mit Scribe v2 Realtime. Das Plugin ist im Lieferumfang enthalten und
standardmäßig aktiviert; ein Schritt vom Typ `plugins install` ist nicht erforderlich.

| Funktion                     | OpenClaw-Oberfläche                                                    | Standard                 |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------ |
| Text-zu-Sprache              | `messages.tts` / `talk`                                                | `eleven_multilingual_v2` |
| Batchweise Sprache-zu-Text   | `tools.media.audio`                                                    | `scribe_v2`              |
| Streaming-Sprache-zu-Text    | Voice-Call-Streaming oder Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Authentifizierung

Legen Sie `ELEVENLABS_API_KEY` in der Umgebung fest. `XI_API_KEY` wird aus
Kompatibilitätsgründen mit vorhandenen ElevenLabs-Werkzeugen ebenfalls akzeptiert.

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
der ausgewählte `voice.tts`-/`messages.tts`-Provider ist: Die Wiedergabe beginnt aus dem
zurückgegebenen Audiostream, statt darauf zu warten, dass OpenClaw zunächst die gesamte
Audiodatei herunterlädt. `latencyTier` wird für Modelle, die ihn akzeptieren, dem
Abfrageparameter `optimize_streaming_latency` von ElevenLabs zugeordnet; bei
`eleven_v3`, das diesen Parameter ablehnt, lässt OpenClaw ihn weg.

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

OpenClaw sendet Multipart-Audio mit `model_id: "scribe_v2"` an
ElevenLabs `/v1/speech-to-text`. Sprachhinweise werden, sofern vorhanden, `language_code` zugeordnet.

## Streaming-STT

Das mitgelieferte `elevenlabs`-Plugin registriert Scribe v2 Realtime für Voice Call und
die Streaming-Transkription im Agentenmodus von Google Meet.

| Einstellung      | Konfigurationspfad                                                        | Standard                                           |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| API-Schlüssel    | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fällt auf `ELEVENLABS_API_KEY` / `XI_API_KEY` zurück |
| Modell           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                               |
| Audioformat      | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                        |
| Abgleichstrategie | `...elevenlabs.commitStrategy`                                           | `vad`                                              |
| Abtastrate       | `...elevenlabs.sampleRate`                                                | `8000`                                             |
| Sprache          | `...elevenlabs.languageCode`                                              | (nicht festgelegt)                                 |

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
Voice Call empfängt Twilio-Medien als G.711-μ-Law mit 8 kHz. Der Realtime-Provider
von ElevenLabs verwendet standardmäßig `ulaw_8000`, sodass Telefonie-Frames ohne
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
