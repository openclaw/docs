---
read_when:
    - Anda ingin text-to-speech ElevenLabs di OpenClaw
    - Anda menginginkan ElevenLabs Scribe speech-to-text untuk lampiran audio
    - Anda ingin transkripsi realtime ElevenLabs untuk Voice Call atau Google Meet
summary: Gunakan ucapan ElevenLabs, Scribe STT, dan transkripsi realtime dengan OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-06-27T18:03:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 126161d7e378382700f203efa9bce1bdd5fe7267b230e2d3d0e45112407d6a7b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw menggunakan ElevenLabs untuk teks-ke-ucapan, ucapan-ke-teks batch dengan Scribe
v2, dan STT streaming dengan Scribe v2 Realtime.

| Kemampuan                | Permukaan OpenClaw                                                   | Bawaan                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------- |
| Teks-ke-ucapan           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| Ucapan-ke-teks batch     | `tools.media.audio`                                                  | `scribe_v2`             |
| Ucapan-ke-teks streaming | streaming Panggilan Suara atau Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`    |

## Autentikasi

Tetapkan `ELEVENLABS_API_KEY` di lingkungan. `XI_API_KEY` juga diterima untuk
kompatibilitas dengan tooling ElevenLabs yang sudah ada.

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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

Tetapkan `modelId` ke `eleven_v3` untuk menggunakan TTS ElevenLabs v3. OpenClaw mempertahankan
`eleven_multilingual_v2` sebagai bawaan untuk instalasi yang sudah ada.

Kanal suara Discord menggunakan endpoint TTS streaming ElevenLabs saat ElevenLabs menjadi
penyedia `voice.tts`/`messages.tts` yang dipilih. Pemutaran dimulai dari
stream audio yang dikembalikan, alih-alih menunggu OpenClaw mengunduh dan menulis
seluruh file audio terlebih dahulu. `latencyTier` dipetakan ke parameter kueri
`optimize_streaming_latency` ElevenLabs untuk model yang menerimanya; OpenClaw
menghilangkan parameter tersebut untuk `eleven_v3`, yang menolaknya.

## Ucapan-ke-teks

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
`model_id: "scribe_v2"`. Petunjuk bahasa dipetakan ke `language_code` jika ada.

## STT streaming

Plugin `elevenlabs` bawaan mendaftarkan Scribe v2 Realtime untuk Panggilan Suara dan
transkripsi streaming mode agen Google Meet.

| Pengaturan      | Jalur konfigurasi                                                      | Bawaan                                            |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| Kunci API       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | Beralih ke `ELEVENLABS_API_KEY` / `XI_API_KEY` jika tidak ada |
| Model           | `...elevenlabs.modelId`                                                | `scribe_v2_realtime`                              |
| Format audio    | `...elevenlabs.audioFormat`                                            | `ulaw_8000`                                       |
| Laju sampel     | `...elevenlabs.sampleRate`                                             | `8000`                                            |
| Strategi commit | `...elevenlabs.commitStrategy`                                         | `vad`                                             |
| Bahasa          | `...elevenlabs.languageCode`                                           | (tidak ditetapkan)                                |

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
Panggilan Suara menerima media Twilio sebagai G.711 u-law 8 kHz. Penyedia realtime
ElevenLabs menggunakan `ulaw_8000` secara default, sehingga frame telepon dapat diteruskan tanpa
transcoding.
</Note>

Untuk mode agen Google Meet, tetapkan
`plugins.entries.google-meet.config.realtime.transcriptionProvider` ke
`"elevenlabs"` dan konfigurasikan blok penyedia yang sama di bawah
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## Terkait

- [Teks-ke-ucapan](/id/tools/tts)
- [Google Meet](/id/plugins/google-meet)
- [Pemilihan model](/id/concepts/model-providers)
