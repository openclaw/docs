---
read_when:
    - Anda ingin menggunakan teks-ke-ucapan ElevenLabs di OpenClaw
    - Anda ingin ElevenLabs Scribe mengubah ucapan menjadi teks untuk lampiran audio
    - Anda menginginkan transkripsi waktu nyata ElevenLabs untuk Panggilan Suara atau Google Meet
summary: Gunakan ucapan ElevenLabs, Scribe STT, dan transkripsi waktu nyata dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:07:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw menggunakan ElevenLabs untuk teks-ke-ucapan, ucapan-ke-teks batch dengan Scribe
v2, dan STT streaming dengan Scribe v2 Realtime.

| Kapabilitas              | Permukaan OpenClaw                                                    | Bawaan                   |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| Teks-ke-ucapan           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Ucapan-ke-teks batch     | `tools.media.audio`                                                  | `scribe_v2`              |
| Ucapan-ke-teks streaming | Streaming Panggilan Suara atau Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## Autentikasi

Atur `ELEVENLABS_API_KEY` di lingkungan. `XI_API_KEY` juga diterima untuk
kompatibilitas dengan tooling ElevenLabs yang ada.

```bash
export ELEVENLABS_API_KEY="..."
```

## Teks-ke-ucapan

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

Atur `modelId` ke `eleven_v3` untuk menggunakan TTS ElevenLabs v3. OpenClaw tetap menjadikan
`eleven_multilingual_v2` sebagai bawaan untuk instalasi yang ada.

## Ucapan-ke-teks

Gunakan Scribe v2 untuk lampiran audio masuk dan segmen suara rekaman singkat:

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
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` saat tersedia.

## STT Streaming

Plugin `elevenlabs` bawaan mendaftarkan Scribe v2 Realtime untuk Panggilan Suara dan
transkripsi streaming mode agen Google Meet.

| Pengaturan      | Path config                                                               | Bawaan                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| Kunci API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Fallback ke `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| Model           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| Laju sampel     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| Strategi commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| Bahasa          | `...elevenlabs.languageCode`                                              | (belum diatur)                                    |

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
Panggilan Suara menerima media Twilio sebagai G.711 u-law 8 kHz. Provider realtime
ElevenLabs secara bawaan menggunakan `ulaw_8000`, sehingga frame telepon dapat diteruskan tanpa
transcoding.
</Note>

Untuk mode agen Google Meet, atur
`plugins.entries.google-meet.config.realtime.transcriptionProvider` ke
`"elevenlabs"` dan konfigurasikan blok provider yang sama di bawah
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Terkait

- [Teks-ke-ucapan](/id/tools/tts)
- [Google Meet](/id/plugins/google-meet)
- [Pemilihan model](/id/concepts/model-providers)
