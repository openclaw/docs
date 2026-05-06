---
read_when:
    - Anda ingin menggunakan pembuatan video Runway di OpenClaw
    - Anda memerlukan konfigurasi kunci API/lingkungan Runway
    - Anda ingin menjadikan Runway penyedia video default
summary: Penyiapan pembuatan video Runway di OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-05-06T09:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw menyertakan penyedia `runway` bawaan untuk pembuatan video yang dihosting. Plugin ini diaktifkan secara default dan mendaftarkan penyedia `runway` pada kontrak `videoGenerationProviders`.

| Properti              | Nilai                                                               |
| --------------------- | ------------------------------------------------------------------- |
| ID penyedia           | `runway`                                                            |
| Plugin                | bawaan, `enabledByDefault: true`                                    |
| Variabel env auth     | `RUNWAYML_API_SECRET` (kanonis) atau `RUNWAY_API_KEY`               |
| Flag onboarding       | `--auth-choice runway-api-key`                                      |
| Flag CLI langsung     | `--runway-api-key <key>`                                            |
| API                   | Pembuatan video berbasis tugas Runway (polling `GET /v1/tasks/{id}`) |
| Model default         | `runway/gen4.5`                                                     |

## Mulai

<Steps>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Tetapkan Runway sebagai penyedia video default">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Buat video">
    Minta agent untuk membuat video. Runway akan digunakan secara otomatis.
  </Step>
</Steps>

## Mode dan model yang didukung

Penyedia ini mengekspos tujuh model Runway yang dibagi ke dalam tiga mode. ID model yang sama dapat melayani lebih dari satu mode (misalnya `gen4.5` berfungsi untuk teks-ke-video dan gambar-ke-video).

| Mode             | Model                                                                  | Input referensi              |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------- |
| Teks-ke-video    | `gen4.5` (default), `veo3.1`, `veo3.1_fast`, `veo3`                    | Tidak ada                    |
| Gambar-ke-video  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 gambar lokal atau remote   |
| Video-ke-video   | `gen4_aleph`                                                           | 1 video lokal atau remote    |

Referensi gambar dan video lokal didukung melalui URI data.

| Rasio aspek          | Nilai yang diizinkan                        |
| -------------------- | ------------------------------------------- |
| Teks-ke-video        | `16:9`, `9:16`                              |
| Edit gambar dan video | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Video-ke-video saat ini memerlukan `runway/gen4_aleph`. ID model Runway lainnya menolak input referensi video.
</Warning>

<Note>
  Memilih ID model Runway dari kolom yang salah menghasilkan error eksplisit sebelum permintaan API keluar dari OpenClaw. Penyedia memvalidasi `model` terhadap daftar yang diizinkan untuk mode tersebut (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) di `extensions/runway/video-generation-provider.ts`.
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
    Salah satu variabel tersebut akan mengautentikasi penyedia Runway.
  </Accordion>

  <Accordion title="Polling tugas">
    Runway menggunakan API berbasis tugas. Setelah mengirimkan permintaan pembuatan, OpenClaw
    melakukan polling `GET /v1/tasks/{id}` sampai video siap. Tidak ada konfigurasi tambahan
    yang diperlukan untuk perilaku polling.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat bersama, pemilihan penyedia, dan perilaku asinkron.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Pengaturan default agent termasuk model pembuatan video.
  </Card>
</CardGroup>
