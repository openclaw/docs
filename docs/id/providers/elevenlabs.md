---
read_when:
    - Anda menginginkan text-to-speech ElevenLabs di OpenClaw
    - Anda menginginkan speech-to-text ElevenLabs Scribe untuk lampiran audio
    - Anda menginginkan transkripsi realtime ElevenLabs untuk Voice Call
summary: Gunakan speech ElevenLabs, Scribe STT, dan transkripsi realtime dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-24T09:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdf86afb839cf90c8caf73a194cb6eae0078661d3ab586d63b9e1276c845e7f7
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw menggunakan ElevenLabs untuk text-to-speech, speech-to-text batch dengan Scribe
v2, dan STT streaming Voice Call dengan Scribe v2 Realtime.

| Kapabilitas              | Surface OpenClaw                                | Default                  |
| ------------------------ | ----------------------------------------------- | ------------------------ |
| Text-to-speech           | `messages.tts` / `talk`                         | `eleven_multilingual_v2` |
| Speech-to-text batch     | `tools.media.audio`                             | `scribe_v2`              |
| Speech-to-text streaming | Voice Call `streaming.provider: "elevenlabs"`   | `scribe_v2_realtime`     |

## Autentikasi

Atur `ELEVENLABS_API_KEY` di environment. `XI_API_KEY` juga diterima untuk
kompatibilitas dengan tooling ElevenLabs yang sudah ada.

```bash
export ELEVENLABS_API_KEY="..."
```

## Text-to-speech

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

## Speech-to-text

Gunakan Scribe v2 untuk lampiran audio masuk dan segmen suara rekaman pendek:

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

OpenClaw mengirim audio multipart ke ElevenLabs `/v1/speech-to-text` dengan
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` saat ada.

## STT streaming Voice Call

Plugin `elevenlabs` bawaan mendaftarkan Scribe v2 Realtime untuk
transkripsi streaming Voice Call.

| Pengaturan      | Path config                                                              | Default                                           |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fallback ke `ELEVENLABS_API_KEY` / `XI_API_KEY`   |
| Model           | `...elevenlabs.modelId`                                                  | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                              | `ulaw_8000`                                       |
| Sample rate     | `...elevenlabs.sampleRate`                                               | `8000`                                            |
| Strategi commit | `...elevenlabs.commitStrategy`                                           | `vad`                                             |
| Bahasa          | `...elevenlabs.languageCode`                                             | (tidak diatur)                                    |

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
Voice Call menerima media Twilio sebagai G.711 u-law 8 kHz. Provider realtime ElevenLabs
default-nya `ulaw_8000`, sehingga frame telepon dapat diteruskan tanpa
transcoding.
</Note>

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Pemilihan model](/id/concepts/model-providers)
