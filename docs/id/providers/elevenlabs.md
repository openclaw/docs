---
read_when:
    - Anda ingin menggunakan text-to-speech ElevenLabs di OpenClaw
    - Anda ingin menggunakan fitur ucapan-ke-teks ElevenLabs Scribe untuk lampiran audio
    - Anda ingin transkripsi waktu nyata ElevenLabs untuk Panggilan Suara atau Google Meet
summary: Gunakan suara ElevenLabs, Scribe STT, dan transkripsi waktu nyata dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T14:36:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw menggunakan ElevenLabs untuk teks-ke-ucapan, ucapan-ke-teks secara batch dengan Scribe
v2, dan STT streaming dengan Scribe v2 Realtime. Plugin ini disertakan dan
diaktifkan secara default; langkah `plugins install` tidak diperlukan.

| Kemampuan                  | Permukaan OpenClaw                                                    | Default                  |
| -------------------------- | --------------------------------------------------------------------- | ------------------------ |
| Teks-ke-ucapan             | `messages.tts` / `talk`                                               | `eleven_multilingual_v2` |
| Ucapan-ke-teks secara batch | `tools.media.audio`                                                   | `scribe_v2`              |
| Ucapan-ke-teks streaming   | Streaming Voice Call atau `realtime.transcriptionProvider` Google Meet | `scribe_v2_realtime`     |

## Autentikasi

Atur `ELEVENLABS_API_KEY` di lingkungan. `XI_API_KEY` juga diterima untuk
kompatibilitas dengan alat ElevenLabs yang sudah ada.

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

Atur `modelId` ke `eleven_v3` untuk menggunakan TTS ElevenLabs v3. OpenClaw tetap
menggunakan `eleven_multilingual_v2` sebagai default untuk instalasi yang sudah ada.

Saluran suara Discord menggunakan endpoint TTS streaming ElevenLabs ketika ElevenLabs
dipilih sebagai penyedia `voice.tts`/`messages.tts`: pemutaran dimulai dari
stream audio yang dikembalikan alih-alih menunggu OpenClaw mengunduh seluruh
berkas audio terlebih dahulu. `latencyTier` dipetakan ke parameter kueri
`optimize_streaming_latency` ElevenLabs untuk model yang menerimanya; OpenClaw
menghilangkan parameter tersebut untuk `eleven_v3`, yang menolaknya.

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

OpenClaw mengirim audio multipart ke `/v1/speech-to-text` ElevenLabs dengan
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` jika tersedia.

## STT streaming

Plugin `elevenlabs` yang disertakan mendaftarkan Scribe v2 Realtime untuk transkripsi
streaming Voice Call dan Google Meet dalam mode agen.

| Pengaturan       | Jalur konfigurasi                                                          | Default                                               |
| ---------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| Kunci API        | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey`  | Menggunakan `ELEVENLABS_API_KEY` / `XI_API_KEY` sebagai cadangan |
| Model            | `...elevenlabs.modelId`                                                    | `scribe_v2_realtime`                                  |
| Format audio     | `...elevenlabs.audioFormat`                                                | `ulaw_8000`                                           |
| Laju sampel      | `...elevenlabs.sampleRate`                                                 | `8000`                                                |
| Strategi commit  | `...elevenlabs.commitStrategy`                                             | `vad`                                                 |
| Bahasa           | `...elevenlabs.languageCode`                                               | (belum diatur)                                        |

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
Voice Call menerima media Twilio sebagai G.711 u-law 8 kHz. Penyedia waktu nyata
ElevenLabs menggunakan `ulaw_8000` secara default, sehingga frame telefoni dapat
diteruskan tanpa transkode.
</Note>

Untuk mode agen Google Meet, atur
`plugins.entries.google-meet.config.realtime.transcriptionProvider` ke
`"elevenlabs"` dan konfigurasikan blok penyedia yang sama di bawah
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Terkait

- [Teks-ke-ucapan](/id/tools/tts)
- [Google Meet](/id/plugins/google-meet)
- [Pemilihan model](/id/concepts/model-providers)
