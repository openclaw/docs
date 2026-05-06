---
read_when:
    - Anda ingin menggunakan fitur ucapan-ke-teks SenseAudio untuk lampiran audio
    - Anda memerlukan variabel lingkungan kunci API SenseAudio atau jalur konfigurasi audio
summary: Transkripsi ucapan ke teks SenseAudio secara massal untuk pesan suara masuk
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio dapat mentranskripsi audio masuk dan lampiran catatan suara melalui pipeline bersama `tools.media.audio` OpenClaw. OpenClaw mengirim audio multipart ke endpoint transkripsi yang kompatibel dengan OpenAI dan menyisipkan teks yang dikembalikan sebagai `{{Transcript}}` ditambah blok `[Audio]`.

| Properti      | Nilai                                            |
| ------------- | ------------------------------------------------ |
| Id penyedia   | `senseaudio`                                     |
| Plugin        | dibundel, `enabledByDefault: true`               |
| Kontrak       | `mediaUnderstandingProviders` (audio)            |
| Var env autentikasi | `SENSEAUDIO_API_KEY`                       |
| Model default | `senseaudio-asr-pro-1.5-260319`                  |
| URL default   | `https://api.senseaudio.cn/v1`                   |
| Situs web     | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentasi   | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## Memulai

<Steps>
  <Step title="Set your API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    Kirim pesan audio melalui channel apa pun yang terhubung. OpenClaw mengunggah
    audio ke SenseAudio dan menggunakan transkrip dalam pipeline balasan.
  </Step>
</Steps>

## Opsi

| Opsi       | Path                                  | Deskripsi                           |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Id model ASR SenseAudio             |
| `language` | `tools.media.audio.models[].language` | Petunjuk bahasa opsional            |
| `prompt`   | `tools.media.audio.prompt`            | Prompt transkripsi opsional         |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Timpa basis yang kompatibel dengan OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | Header permintaan tambahan          |

<Note>
SenseAudio hanya STT batch di OpenClaw. Transkripsi realtime Voice Call
tetap menggunakan penyedia dengan dukungan STT streaming.
</Note>

## Terkait

- [Pemahaman media (audio)](/id/nodes/audio)
- [Penyedia model](/id/concepts/model-providers)
