---
read_when:
    - Anda ingin teks-ke-suara ElevenLabs di OpenClaw
    - Anda menginginkan ElevenLabs Scribe untuk konversi ucapan-ke-teks pada lampiran audio
    - Anda menginginkan transkripsi waktu nyata ElevenLabs untuk Panggilan Suara atau Google Meet
summary: Gunakan suara ElevenLabs, Scribe STT, dan transkripsi waktu nyata dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-07T13:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72e655dc2260a353bb5e84e6df32cc39bf6329836cb29ab569c3f93833df144a
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw menggunakan ElevenLabs untuk text-to-speech, speech-to-text batch dengan Scribe
v2, dan STT streaming dengan Scribe v2 Realtime.

| Kemampuan                | Permukaan OpenClaw                                                   | Bawaan                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------- |
| Text-to-speech           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Speech-to-text batch     | `tools.media.audio`                                                  | `scribe_v2`             |
| Speech-to-text streaming | Streaming Voice Call atau Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`    |

## Autentikasi

Atur `ELEVENLABS_API_KEY` di lingkungan. `XI_API_KEY` juga diterima untuk
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

Atur `modelId` ke `eleven_v3` untuk menggunakan ElevenLabs v3 TTS. OpenClaw mempertahankan
`eleven_multilingual_v2` sebagai bawaan untuk instalasi yang sudah ada.

Saluran suara Discord menggunakan endpoint TTS streaming ElevenLabs saat ElevenLabs menjadi
penyedia `voice.tts`/`messages.tts` yang dipilih. Pemutaran dimulai dari stream audio
yang dikembalikan alih-alih menunggu OpenClaw mengunduh dan menulis seluruh file
audio terlebih dahulu. `latencyTier` dipetakan ke parameter kueri ElevenLabs
`optimize_streaming_latency` untuk model yang menerimanya; OpenClaw
menghilangkan parameter tersebut untuk `eleven_v3`, yang menolaknya.

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
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` bila ada.

## STT Streaming

Plugin `elevenlabs` bawaan mendaftarkan Scribe v2 Realtime untuk transkripsi streaming
mode agen Voice Call dan Google Meet.

| Pengaturan      | Jalur konfigurasi                                                       | Bawaan                                            |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| Kunci API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Beralih ke `ELEVENLABS_API_KEY` / `XI_API_KEY`    |
| Model           | `...elevenlabs.modelId`                                                 | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                             | `ulaw_8000`                                       |
| Laju sampel     | `...elevenlabs.sampleRate`                                              | `8000`                                            |
| Strategi commit | `...elevenlabs.commitStrategy`                                          | `vad`                                             |
| Bahasa          | `...elevenlabs.languageCode`                                            | (belum diatur)                                    |

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
Voice Call menerima media Twilio sebagai G.711 u-law 8 kHz. Penyedia realtime
ElevenLabs menggunakan `ulaw_8000` sebagai bawaan, sehingga frame telepon dapat diteruskan tanpa
transcoding.
</Note>

Untuk mode agen Google Meet, atur
`plugins.entries.google-meet.config.realtime.transcriptionProvider` ke
`"elevenlabs"` dan konfigurasikan blok penyedia yang sama di bawah
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Terkait

- [Text-to-speech](/id/tools/tts)
- [Google Meet](/id/plugins/google-meet)
- [Pemilihan model](/id/concepts/model-providers)
