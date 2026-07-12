---
read_when:
    - Anda ingin menggunakan fitur ucapan-ke-teks SenseAudio untuk lampiran audio
    - Anda memerlukan variabel lingkungan kunci API SenseAudio atau jalur konfigurasi audio
summary: Transkripsi ucapan-ke-teks batch SenseAudio untuk catatan suara masuk
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T14:38:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio mentranskripsikan lampiran audio masuk dan pesan suara melalui pipeline `tools.media.audio` bersama milik OpenClaw. OpenClaw mengirim audio multipart ke endpoint transkripsi yang kompatibel dengan OpenAI dan menyisipkan teks yang dikembalikan sebagai `{{Transcript}}` beserta blok `[Audio]`.

| Properti      | Nilai                                            |
| ------------- | ------------------------------------------------ |
| ID penyedia   | `senseaudio`                                     |
| Plugin        | bawaan, `enabledByDefault: true`                 |
| Kontrak       | `mediaUnderstandingProviders` (audio)            |
| Variabel lingkungan autentikasi | `SENSEAUDIO_API_KEY`             |
| Model default | `senseaudio-asr-pro-1.5-260319`                  |
| URL default   | `https://api.senseaudio.cn/v1`                   |
| Situs web     | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentasi   | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API Anda">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Aktifkan penyedia audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Kirim pesan suara">
    Kirim pesan audio melalui saluran apa pun yang terhubung. OpenClaw mengunggah
    audio ke SenseAudio dan menggunakan transkrip tersebut dalam pipeline balasan.
  </Step>
</Steps>

## Opsi

| Opsi       | Jalur                                 | Deskripsi                                  |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | ID model ASR SenseAudio                    |
| `language` | `tools.media.audio.models[].language` | Petunjuk bahasa opsional                   |
| `prompt`   | `tools.media.audio.prompt`            | Prompt transkripsi opsional                |
| `baseUrl`  | `tools.media.audio.baseUrl` atau model | Mengganti basis yang kompatibel dengan OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Header permintaan tambahan                 |

<Note>
SenseAudio hanya mendukung STT batch di OpenClaw. Transkripsi waktu nyata Panggilan Suara
tetap menggunakan penyedia yang mendukung STT streaming.
</Note>

## Terkait

- [Pemahaman media (audio)](/id/nodes/audio)
- [Penyedia model](/id/concepts/model-providers)
