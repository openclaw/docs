---
read_when:
    - Anda ingin menggunakan pembuatan video PixVerse di OpenClaw
    - Anda perlu menyiapkan kunci API/variabel lingkungan PixVerse
    - Anda ingin menjadikan PixVerse sebagai penyedia video default
summary: Penyiapan pembuatan video PixVerse di OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T14:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw menyediakan `pixverse` sebagai plugin eksternal resmi untuk pembuatan video PixVerse yang dihosting. Plugin ini mendaftarkan penyedia `pixverse` pada kontrak `videoGenerationProviders`.

| Properti              | Nilai                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| ID penyedia           | `pixverse`                                                                  |
| Paket plugin          | `@openclaw/pixverse-provider`                                               |
| Variabel lingkungan autentikasi | `PIXVERSE_API_KEY`                                                |
| Flag orientasi awal   | `--auth-choice pixverse-api-key`                                            |
| Flag CLI langsung     | `--pixverse-api-key <key>`                                                  |
| API                   | PixVerse Platform API v2 (pengiriman `video_id` serta polling hasil)        |
| Model bawaan          | `pixverse/v6`                                                               |
| Wilayah API bawaan    | Internasional                                                               |

## Memulai

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Wisaya meminta Anda memilih endpoint Internasional atau CN (lihat wilayah API
    di bawah) sebelum menulis `region` dan `baseUrl` ke konfigurasi penyedia.
    Eksekusi noninteraktif (kunci dari `--pixverse-api-key` atau `PIXVERSE_API_KEY`)
    secara bawaan menggunakan Internasional.

    Orientasi awal juga menetapkan `agents.defaults.videoGenerationModel.primary` ke
    `pixverse/v6` jika model video bawaan belum dikonfigurasi.

  </Step>
  <Step title="Ganti penyedia video bawaan yang sudah ada (opsional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Buat video">
    Minta agen membuat video. PixVerse akan digunakan secara otomatis.
  </Step>
</Steps>

## Mode dan model yang didukung

Penyedia ini mengekspos model pembuatan PixVerse melalui alat video bersama OpenClaw.

| Mode                 | Model                | Masukan referensi            |
| -------------------- | -------------------- | ---------------------------- |
| Teks ke video        | `v6` (bawaan), `c1`  | Tidak ada                    |
| Gambar ke video      | `v6` (bawaan), `c1`  | 1 gambar lokal atau jarak jauh |

Referensi gambar lokal diunggah ke PixVerse sebelum permintaan gambar ke video. URL gambar jarak jauh diteruskan melalui endpoint pengunggahan gambar PixVerse sebagai `image_url`.

| Opsi             | Nilai yang didukung                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Durasi           | 1–15 detik (bawaan 5)                                                                                                                       |
| Resolusi         | `360P`, `540P`, `720P`, `1080P` (bawaan `540P`; permintaan `480P` dipetakan ke `540P`)                                                     |
| Rasio aspek      | `16:9` (bawaan), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; hanya teks ke video, gambar ke video mengikuti gambar sumber           |
| Audio yang dibuat | `audio: true`                                                                                                                              |

<Note>
Pembuatan templat gambar PixVerse belum diekspos melalui `image_generate`. API tersebut digerakkan oleh ID templat, sedangkan kontrak pembuatan gambar bersama OpenClaw saat ini belum memiliki kumpulan opsi bertipe yang khusus untuk PixVerse.
</Note>

## Opsi penyedia

Penyedia video menerima kunci khusus penyedia opsional berikut:

| Opsi                                 | Tipe   | Efek                                             |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `seed`                               | angka  | Seed deterministik, 0 hingga 2147483647          |
| `negativePrompt` / `negative_prompt` | string | Prompt negatif                                   |
| `quality`                            | string | Kualitas PixVerse seperti `720p`                 |
| `motionMode` / `motion_mode`         | string | Mode gerakan gambar ke video (bawaan `normal`)   |
| `cameraMovement` / `camera_movement` | string | Preset gerakan kamera PixVerse                   |
| `templateId` / `template_id`         | angka  | ID templat PixVerse yang diaktifkan              |

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Wilayah API">
    | Nilai wilayah    | URL dasar API PixVerse                         |
    | ---------------- | ---------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`       |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`     |

    Tetapkan `models.providers.pixverse.region` secara manual jika kunci Anda berasal dari
    wilayah platform PixVerse tertentu, atau jalankan
    `openclaw onboard --auth-choice pixverse-api-key` untuk memilihnya dalam
    wisaya penyiapan:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" atau "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL dasar khusus">
    Tetapkan `models.providers.pixverse.baseUrl` hanya saat merutekan melalui proksi kompatibel yang tepercaya.
    `baseUrl` lebih diprioritaskan daripada `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Polling tugas">
    PixVerse mengembalikan `video_id` dari permintaan pembuatan. OpenClaw melakukan polling
    `/openapi/v2/video/result/{video_id}` setiap 5 detik hingga tugas
    berhasil, gagal, atau mencapai batas waktu (bawaan 5 menit; timpa dengan
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat bersama, pemilihan penyedia, dan perilaku asinkron.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Pengaturan bawaan agen, termasuk model pembuatan video.
  </Card>
</CardGroup>
