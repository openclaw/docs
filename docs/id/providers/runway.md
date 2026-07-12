---
read_when:
    - Anda ingin menggunakan pembuatan video Runway di OpenClaw
    - Anda perlu menyiapkan kunci API/variabel lingkungan Runway
    - Anda ingin menjadikan Runway sebagai penyedia video default
summary: Penyiapan pembuatan video Runway di OpenClaw
title: Landasan Pacu
x-i18n:
    generated_at: "2026-07-12T14:34:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw menyertakan provider `runway` terbundel untuk pembuatan video terhosting, diaktifkan secara default, dan didaftarkan pada kontrak `videoGenerationProviders`.

| Properti                | Nilai                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| ID provider             | `runway`                                                               |
| Plugin                  | terbundel, `enabledByDefault: true`                                     |
| Variabel lingkungan autentikasi | `RUNWAYML_API_SECRET` (kanonis) atau `RUNWAY_API_KEY`          |
| Flag orientasi awal     | `--auth-choice runway-api-key`                                         |
| Flag CLI langsung       | `--runway-api-key <key>`                                               |
| API                     | Pembuatan video berbasis tugas Runway (polling `GET /v1/tasks/{id}`)   |
| Model default           | `runway/gen4.5`                                                        |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Tetapkan Runway sebagai provider video default">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Buat video">
    Minta agen untuk membuat video. Runway akan digunakan secara otomatis.
  </Step>
</Steps>

## Mode dan model yang didukung

Provider ini menyediakan tujuh model Runway yang terbagi dalam tiga mode. ID model yang sama dapat digunakan untuk lebih dari satu mode (misalnya, `gen4.5` berfungsi untuk teks-ke-video maupun gambar-ke-video).

| Mode             | Model                                                                  | Input referensi               |
| ---------------- | ---------------------------------------------------------------------- | ----------------------------- |
| Teks-ke-video    | `gen4.5` (default), `veo3.1`, `veo3.1_fast`, `veo3`                    | Tidak ada                     |
| Gambar-ke-video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 gambar lokal atau jarak jauh |
| Video-ke-video   | `gen4_aleph`                                                           | 1 video lokal atau jarak jauh |

Referensi gambar dan video lokal didukung melalui URI data.

| Rasio aspek                 | Nilai yang diizinkan                         |
| --------------------------- | -------------------------------------------- |
| Teks-ke-video               | `16:9`, `9:16`                               |
| Penyuntingan gambar dan video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video-ke-video saat ini memerlukan `runway/gen4_aleph`. ID model Runway lainnya menolak input referensi video.
</Warning>

<Note>
  Memilih ID model Runway dari kolom yang salah menghasilkan galat eksplisit sebelum permintaan API meninggalkan OpenClaw. Provider memvalidasi `model` terhadap daftar izin mode tersebut (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) di `extensions/runway/video-generation-provider.ts`.
</Note>

## Konfigurasi

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Alias variabel lingkungan">
    OpenClaw mengenali `RUNWAYML_API_SECRET` (kanonis) dan `RUNWAY_API_KEY`.
    Salah satu variabel tersebut dapat mengautentikasi provider Runway.
  </Accordion>

  <Accordion title="Polling tugas">
    Runway menggunakan API berbasis tugas. Setelah mengirimkan permintaan pembuatan, OpenClaw
    melakukan polling `GET /v1/tasks/{id}` hingga video siap. Tidak diperlukan
    konfigurasi tambahan untuk perilaku polling tersebut.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat bersama, pemilihan provider, dan perilaku asinkron.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Pengaturan default agen, termasuk model pembuatan video.
  </Card>
</CardGroup>
