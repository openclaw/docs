---
read_when:
    - Anda ingin menggunakan pembuatan video PixVerse di OpenClaw
    - Anda memerlukan penyiapan kunci API/env PixVerse
    - Anda ingin menjadikan PixVerse sebagai penyedia video default
summary: Penyiapan pembuatan video PixVerse di OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:06:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw menyediakan `pixverse` sebagai Plugin eksternal resmi untuk pembuatan video PixVerse yang dihosting. Plugin ini mendaftarkan penyedia `pixverse` terhadap kontrak `videoGenerationProviders`.

| Properti             | Nilai                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| ID penyedia          | `pixverse`                                                              |
| Paket Plugin         | `@openclaw/pixverse-provider`                                           |
| Variabel env auth    | `PIXVERSE_API_KEY`                                                      |
| Flag onboarding      | `--auth-choice pixverse-api-key`                                        |
| Flag CLI langsung    | `--pixverse-api-key <key>`                                              |
| API                  | PixVerse Platform API v2 (pengiriman `video_id` plus polling hasil)     |
| Model default        | `pixverse/v6`                                                           |
| Wilayah API default  | Internasional                                                           |

## Memulai

<Steps>
  <Step title="Instal Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Atur kunci API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    Wizard menanyakan apakah akan menggunakan endpoint Internasional
    (`https://app-api.pixverse.ai/openapi/v2`) atau endpoint CN
    (`https://app-api.pixverseai.cn/openapi/v2`) sebelum menulis `region` dan
    `baseUrl` ke dalam konfigurasi penyedia.

  </Step>
  <Step title="Atur PixVerse sebagai penyedia video default">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Buat video">
    Minta agen untuk membuat video. PixVerse akan digunakan secara otomatis.
  </Step>
</Steps>

## Mode dan model yang didukung

Penyedia mengekspos model pembuatan PixVerse melalui alat video bersama OpenClaw.

| Mode           | Model                | Input referensi        |
| -------------- | -------------------- | ---------------------- |
| Teks-ke-video  | `v6` (default), `c1` | Tidak ada              |
| Gambar-ke-video | `v6` (default), `c1` | 1 gambar lokal atau jarak jauh |

Referensi gambar lokal diunggah ke PixVerse sebelum permintaan gambar-ke-video. URL gambar jarak jauh diteruskan melalui endpoint unggah gambar PixVerse sebagai `image_url`.

| Opsi                 | Nilai yang didukung                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| Durasi               | 1-15 detik                                                                    |
| Resolusi             | `360P`, `540P`, `720P`, `1080P`                                               |
| Rasio aspek          | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` untuk teks-ke-video |
| Audio yang dihasilkan | `audio: true`                                                                |

<Note>
Pembuatan templat gambar PixVerse belum diekspos melalui `image_generate`. API tersebut digerakkan oleh ID templat, sedangkan kontrak pembuatan gambar bersama OpenClaw saat ini belum memiliki kantong opsi bertipe khusus PixVerse.
</Note>

## Opsi penyedia

Penyedia video menerima kunci opsional khusus penyedia berikut:

| Opsi                                 | Tipe   | Efek                                        |
| ------------------------------------ | ------ | ------------------------------------------- |
| `seed`                               | number | Seed deterministik saat didukung            |
| `negativePrompt` / `negative_prompt` | string | Prompt negatif                              |
| `quality`                            | string | Kualitas PixVerse seperti `720p`            |
| `motionMode` / `motion_mode`         | string | Mode gerakan gambar-ke-video                |
| `cameraMovement` / `camera_movement` | string | Preset gerakan kamera PixVerse              |
| `templateId` / `template_id`         | number | ID templat PixVerse yang diaktifkan         |

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
    OpenClaw secara default menggunakan API PixVerse internasional. Atur `models.providers.pixverse.region`
    secara manual saat kunci Anda berasal dari wilayah platform PixVerse tertentu, atau gunakan
    `openclaw onboard --auth-choice pixverse-api-key` untuk memilihnya di wizard penyiapan:

    | Nilai wilayah   | URL dasar API PixVerse                         |
    | --------------- | ---------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`       |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`     |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL dasar khusus">
    Atur `models.providers.pixverse.baseUrl` hanya saat merutekan melalui proxy kompatibel yang tepercaya.
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
    `/openapi/v2/video/result/{video_id}` hingga tugas berhasil, gagal,
    atau waktu habis.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat bersama, pemilihan penyedia, dan perilaku asinkron.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Pengaturan default agen termasuk model pembuatan video.
  </Card>
</CardGroup>
