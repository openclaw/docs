---
read_when:
    - Anda ingin menggunakan pembuatan video Runway di OpenClaw
    - Anda memerlukan penyiapan kunci API/env Runway
    - Anda ingin menjadikan Runway sebagai provider video default
summary: Penyiapan pembuatan video Runway di OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-24T09:24:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw menyediakan provider `runway` bawaan untuk pembuatan video yang dihosting.

| Properti    | Nilai                                                             |
| ----------- | ----------------------------------------------------------------- |
| ID provider | `runway`                                                          |
| Autentikasi        | `RUNWAYML_API_SECRET` (kanonis) atau `RUNWAY_API_KEY`             |
| API         | Pembuatan video berbasis tugas Runway (`GET /v1/tasks/{id}` polling) |

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

## Mode yang didukung

| Mode           | Model              | Input referensi         |
| -------------- | ------------------ | ----------------------- |
| Teks-ke-video  | `gen4.5` (default) | Tidak ada                    |
| Gambar-ke-video | `gen4.5`           | 1 gambar lokal atau remote |
| Video-ke-video | `gen4_aleph`       | 1 video lokal atau remote |

<Note>
Referensi gambar dan video lokal didukung melalui data URI. Proses yang hanya menggunakan teks
saat ini mengekspos rasio aspek `16:9` dan `9:16`.
</Note>

<Warning>
Video-ke-video saat ini memerlukan `runway/gen4_aleph` secara khusus.
</Warning>

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
    Salah satu variabel akan mengautentikasi provider Runway.
  </Accordion>

  <Accordion title="Polling tugas">
    Runway menggunakan API berbasis tugas. Setelah mengirim permintaan pembuatan, OpenClaw
    melakukan polling `GET /v1/tasks/{id}` sampai video siap. Tidak diperlukan
    konfigurasi tambahan untuk perilaku polling ini.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat bersama, pemilihan provider, dan perilaku asinkron.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/config-agents#agent-defaults" icon="gear">
    Pengaturan default agen termasuk model pembuatan video.
  </Card>
</CardGroup>
